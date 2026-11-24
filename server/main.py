"""FastAPI endpoints for the dyslexia support app demo."""
from collections import Counter
from pathlib import Path
import re
from typing import List, Literal, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from features import clean, extract_features
except ImportError:
    clean = extract_features = None

app = FastAPI(title="Dyslexia Support API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
MODEL_PATH = Path(__file__).with_name("dyslexia_rf.joblib")
STOP_WORDS = set("a an and are as at be been by for from has have he her hers him his i in is it its me my of on or our she that the their them they this to was we were will with you your".split())


class ClassifyRequest(BaseModel):
    intended: str
    typed: str


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
        raise HTTPException(status_code=422, detail="Add a few notes before making practice questions.")
    flashcards = [PracticeFlashcard(front="What does the text say?", back=sentences[index % len(sentences)]) for index in range(request.count)]
    questions = []
    for index in range(request.count):
        kind = request.types[index % len(request.types)]
        fact = sentences[index % len(sentences)]
        if kind == "multiple_choice":
            answer_index = index % 4
            questions.append(PracticeQuestion(type=kind, question="Which statement matches the text?", options=make_multiple_choice(sentences, fact, answer_index), answer_index=answer_index, answer=fact, explanation=f"The text states: {fact}"))
        elif kind == "true_false":
            is_true = index % 2 == 0
            statement = f"The text says: {fact}" if is_true else f"The text says this did not happen: {fact}"
            answer = "True" if is_true else "False"
            questions.append(PracticeQuestion(type=kind, question=statement, options=["True", "False", "Not stated", "I am not sure"], answer_index=0 if is_true else 1, answer=answer, explanation=f"The text states: {fact}"))
        else:
            questions.append(PracticeQuestion(type=kind, question="What fact does the text give?", answer_index=None, answer=fact, explanation="This answer repeats a fact from the text."))
    return StudyPracticeResponse(flashcards=flashcards, questions=questions, difficulty=request.difficulty)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify")
def classify(request: ClassifyRequest):
    if clean is None or extract_features is None:
        raise HTTPException(status_code=503, detail="Add the notebook feature functions to server/features.py.")
    try:
        intended = clean(request.intended)
        typed = clean(request.typed)
    except NotImplementedError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    if not intended or not typed:
        raise HTTPException(status_code=422, detail="Both intended and typed must contain a word.")
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Model file server/dyslexia_rf.joblib is missing.")
    try:
        saved = joblib.load(MODEL_PATH)
        model, columns = saved["model"], saved["columns"]
        features = extract_features(intended, typed)
        frame = pd.DataFrame([{name: features[name] for name in columns}], columns=columns)
        label = str(model.predict(frame)[0])
        confidence = float(max(model.predict_proba(frame)[0]))
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Classifier setup needs attention: {error}") from error
    return {"label": label, "confidence": confidence}


@app.post("/summarize")
def summarize(request: SummaryRequest):
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", request.text.strip()) if part.strip()]
    words = re.findall(r"\b[\w']+\b", request.text.lower())
    if len(words) < 20:
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
