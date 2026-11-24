"""FastAPI endpoints for the dyslexia support app demo."""
from collections import Counter
from contextlib import asynccontextmanager
from pathlib import Path
import re
from typing import Any, List, Literal, Optional

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from features import clean, extract_features

MODEL_PATH = Path(__file__).with_name("dyslexia_rf.joblib")
LABELS = ["reversal", "transposition", "omission", "phonetic", "other"]
STOP_WORDS = set("a an and are as at be been by for from has have he her hers him his i in is it its me my of on or our she that the their them they this to was we were will with you your".split())
MAX_LEN = 30
rf_model = None
model_columns = []
model_error = "The spelling model file was not found."


def load_classifier():
    """Load the saved model bundle once as the API starts."""
    global rf_model, model_columns, model_error
    if not MODEL_PATH.exists():
        model_error = "The spelling model file was not found."
        return
    try:
        bundle = joblib.load(MODEL_PATH)
        rf_model = bundle["model"]
        model_columns = list(bundle["columns"])
        model_error = ""
    except Exception:
        rf_model = None
        model_columns = []
        model_error = "The spelling model could not be loaded. Check its package versions."


@asynccontextmanager
async def lifespan(app):
    load_classifier()
    yield


app = FastAPI(title="Dyslexia Support API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ClassifyRequest(BaseModel):
    intended: Any = None
    typed: Any = None


class SummaryRequest(BaseModel):
    text: str


class StudyPracticeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    count: Literal[5, 10, 15] = 5
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    types: List[Literal["multiple_choice", "true_false", "short_answer"]] = Field(min_length=1)
    ageBand: str = Field(default="general", max_length=40)


class PracticeFlashcard(BaseModel):
    front: str
    back: str


class PracticeQuestion(BaseModel):
    type: Literal["multiple_choice", "true_false", "short_answer"]
    question: str
    options: List[str] = Field(default_factory=list)
    answer_index: Optional[int] = None
    answer: str
    explanation: str


class StudyPracticeResponse(BaseModel):
    flashcards: List[PracticeFlashcard]
    questions: List[PracticeQuestion]
    difficulty: Literal["Easy", "Medium", "Hard"]


def validate_pair(intended, typed):
    """Check and clean one intended word and one typed word."""
    warnings = []
    if not isinstance(intended, str) or not isinstance(typed, str):
        return False, "Please enter both words as text.", "", "", warnings
    a_raw, b_raw = intended.strip(), typed.strip()
    if not a_raw or not b_raw:
        return False, "Please fill in both words: the word you meant and the word you wrote.", "", "", warnings
    if re.search(r"\s", a_raw) or re.search(r"\s", b_raw):
        return False, "Please enter one word at a time (no spaces).", "", "", warnings
    a, b = clean(a_raw), clean(b_raw)
    if not a or not b:
        return False, "Please use letters only (a to z). Numbers and symbols cannot be checked.", "", "", warnings
    if a != a_raw.lower() or b != b_raw.lower():
        warnings.append("Characters that are not letters were ignored.")
    if len(a) > MAX_LEN or len(b) > MAX_LEN:
        return False, f"Words longer than {MAX_LEN} letters are not supported.", "", "", warnings
    if a == b:
        return False, "The two words are the same, so there is no mistake to classify.", "", "", warnings
    if len(a) == 1 or len(b) == 1:
        warnings.append("Very short words give less reliable results.")
    return True, "", a, b, warnings


def plain_reasons(target, typed, clues):
    reasons = []
    difference = clues["len_diff"]
    if difference < 0:
        reasons.append(f"The typed word is {abs(difference)} letter(s) shorter than the word you meant.")
    elif difference > 0:
        reasons.append(f"The typed word has {difference} extra letter(s).")
    else:
        reasons.append("Both words have the same number of letters.")
    if clues["same_letters"]:
        reasons.append("Both words use exactly the same letters, only in a different order.")
    if clues["mirror_swaps"]:
        reasons.append("A letter was swapped for its mirror image (b and d, or p and q).")
    if clues["sound_match"]:
        reasons.append("The two words sound the same (they share the same sound code).")
    else:
        reasons.append("The two words do not sound the same.")
    reasons.append(f"The spellings look {round(clues['similarity'] * 100)}% alike.")
    if not clues["first_letter_same"]:
        reasons.append("The first letter is different.")
    return reasons


def classify_with_explanation(intended, typed, model=None, columns=None):
    ok, message, target, written, warnings = validate_pair(intended, typed)
    if not ok:
        return {"ok": False, "message": message}
    model = model or rf_model
    columns = list(columns or model_columns)
    if model is None or not columns:
        return {"ok": False, "message": model_error or "The spelling model is not ready yet."}
    clues = extract_features(target, written)
    row = pd.DataFrame([clues])[columns]
    probabilities = model.predict_proba(row)[0]
    ranked = sorted(zip(model.classes_, probabilities), key=lambda pair: -pair[1])
    label, confidence = ranked[0]
    if confidence < 0.6:
        warnings.append("The model is not very sure about this one. The mistake may mix several types.")
    importance_order = sorted(zip(columns, model.feature_importances_), key=lambda pair: -pair[1])
    return {
        "ok": True,
        "intended": target,
        "typed": written,
        "label": str(label),
        "confidence": round(float(confidence), 3),
        "probabilities": {str(name): round(float(value), 3) for name, value in ranked},
        "clues": {key: (round(value, 3) if isinstance(value, float) else value) for key, value in clues.items()},
        "reasons": plain_reasons(target, written, clues),
        "top_clues_overall": [name for name, _value in importance_order[:3]],
        "warnings": warnings,
    }


def make_multiple_choice(sentences, fact, answer_index):
    choices = [item for item in sentences if item != fact][:3]
    fillers = ["The text does not mention this detail.", "This detail is not stated in the text.", "The text gives no information about this."]
    for filler in fillers:
        if len(choices) == 3:
            break
        if filler not in choices:
            choices.append(filler)
    choices.insert(answer_index, fact)
    return choices[:4]


def build_study_practice(request):
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+|[\r\n]+", request.text.strip()) if part.strip()]
    if not sentences:
        return StudyPracticeResponse(flashcards=[], questions=[], difficulty=request.difficulty)
    flashcards = [PracticeFlashcard(front="What does the text say?", back=sentences[index % len(sentences)]) for index in range(request.count)]
    questions = []
    for index in range(request.count):
        kind = request.types[index % len(request.types)]
        fact = sentences[index % len(sentences)]
        if kind == "multiple_choice":
            answer_index = index % 4
            question = "Which statement can you find in the text?" if request.difficulty == "Easy" else "Which statement is supported by the text?"
            questions.append(PracticeQuestion(type=kind, question=question, options=make_multiple_choice(sentences, fact, answer_index), answer_index=answer_index, answer=fact, explanation=f"The text states: {fact}"))
        elif kind == "true_false":
            is_true = index % 2 == 0
            statement = f"The text says: {fact}" if is_true else f"The text says this did not happen: {fact}"
            answer = "True" if is_true else "False"
            questions.append(PracticeQuestion(type=kind, question=statement, options=["True", "False", "Not stated", "I am not sure"], answer_index=0 if is_true else 1, answer=answer, explanation=f"The text states: {fact}"))
        else:
            questions.append(PracticeQuestion(type=kind, question="What fact does the text give?", options=[], answer_index=None, answer=fact, explanation="This answer repeats a fact from the text."))
    return StudyPracticeResponse(flashcards=flashcards, questions=questions, difficulty=request.difficulty)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify")
def classify(request: ClassifyRequest):
    try:
        return classify_with_explanation(request.intended, request.typed)
    except Exception:
        return {"ok": False, "message": "The model could not check this word pair. Please try again."}


@app.get("/model-info")
def model_info():
    if rf_model is None:
        return {"model_name": "unavailable", "labels": LABELS, "feature_importances": [], "available": False}
    feature_importances = sorted(zip(model_columns, rf_model.feature_importances_), key=lambda pair: -pair[1])
    return {
        "model_name": type(rf_model).__name__,
        "labels": [str(label) for label in rf_model.classes_],
        "feature_importances": [{"feature": name, "importance": round(float(value), 4)} for name, value in feature_importances],
        "available": True,
    }


@app.post("/summarize")
def summarize(request: SummaryRequest):
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", request.text.strip()) if part.strip()]
    words = re.findall(r"\b[\w']+\b", request.text.lower())
    if len(words) < 20:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Please provide at least 20 words to summarize.")
    frequencies = Counter(word for word in words if word not in STOP_WORDS)
    scored = []
    for index, sentence in enumerate(sentences):
        terms = [word for word in re.findall(r"\b[\w']+\b", sentence.lower()) if word not in STOP_WORDS]
        score = sum(frequencies[word] for word in terms) / max(1, len(terms))
        scored.append((score, index, sentence))
    amount = min(5, max(3, len(sentences)))
    selected = sorted(scored, key=lambda item: item[0], reverse=True)[:amount]
    return {"bullets": [sentence for _, _, sentence in sorted(selected, key=lambda item: item[1])]}


@app.post("/study", response_model=StudyPracticeResponse)
def study(request: StudyPracticeRequest):
    return build_study_practice(request)
