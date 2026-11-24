// Builds study practice settings and reuses the shared flashcard and quiz flows.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, BodyText, ErrorMessage, Loading } from './AppUI';
import FlashcardDeck from './FlashcardDeck';
import QuizFlow from './QuizFlow';
import { generatePractice } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const questionTypes = [
  ['multiple_choice', 'Multiple choice'], ['true_false', 'True or false'], ['short_answer', 'Short answer self-check'],
];

export default function PracticeSection({ text }) {
  const { colors } = useSettings();
  const [count, setCount] = useState(5); const [difficulty, setDifficulty] = useState('Easy'); const [types, setTypes] = useState(['multiple_choice']);
  const [timerEnabled, setTimerEnabled] = useState(false); const [practice, setPractice] = useState(null); const [runId, setRunId] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const toggleType = (type) => setTypes((old) => old.includes(type) ? old.filter((item) => item !== type) : [...old, type]);
  const makeQuestions = async () => {
    setError('');
    if (!text.trim()) { setError('Add or summarise some notes first.'); return; }
    if (!types.length) { setError('Choose at least one question type.'); return; }
    setBusy(true);
    try { setPractice(await generatePractice(text, count, difficulty, types, 'general')); setRunId((old) => old + 1); }
    catch (issue) { setError(issue.message || "Can't reach the server. Check Wi-Fi and the server address."); }
    finally { setBusy(false); }
  };
  const optionButton = (label, active, onPress, accessibilityLabel) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ selected: active }} onPress={onPress} style={{ minHeight: 52, minWidth: 64, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, backgroundColor: active ? colors.accent : colors.soft, borderRadius: 12, marginRight: 8, marginBottom: 8 }}><BodyText style={{ color: active ? colors.background : colors.text }}>{label}</BodyText></Pressable>;
  return <View style={{ marginTop: 20 }}>
    <BodyText style={{ fontSize: 26, marginBottom: 8 }}>Practice for exams</BodyText>
    <BodyText>Number of questions</BodyText><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{[5, 10, 15].map((value) => optionButton(String(value), count === value, () => setCount(value)))}</View>
    <BodyText>Difficulty</BodyText><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{['Easy', 'Medium', 'Hard'].map((value) => optionButton(value, difficulty === value, () => setDifficulty(value)))}</View>
    <BodyText>Question types</BodyText>{questionTypes.map(([type, label]) => <Pressable key={type} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: types.includes(type) }} onPress={() => toggleType(type)} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center' }}><Ionicons name={types.includes(type) ? 'checkbox-outline' : 'square-outline'} size={24} color={colors.accent} style={{ marginRight: 10 }} /><BodyText>{label}</BodyText></Pressable>)}
    <Pressable accessibilityRole="switch" accessibilityLabel="Optional exam timer" accessibilityState={{ checked: timerEnabled }} onPress={() => setTimerEnabled(!timerEnabled)} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center' }}><Ionicons name={timerEnabled ? 'checkbox-outline' : 'square-outline'} size={24} color={colors.accent} style={{ marginRight: 10 }} /><BodyText>Use an exam timer (optional)</BodyText></Pressable>
    <ActionButton label={busy ? 'Making questions...' : 'Make practice questions'} icon="help-circle-outline" onPress={makeQuestions} disabled={busy} />
    {busy ? <Loading /> : null}{error ? <ErrorMessage>{error}</ErrorMessage> : null}
    {practice ? <View><BodyText style={{ marginTop: 12 }}>Practice set: {practice.difficulty}</BodyText><FlashcardDeck key={`cards-${runId}`} cards={practice.flashcards} /><QuizFlow key={`quiz-${runId}`} questions={practice.questions} timerEnabled={timerEnabled} /></View> : null}
  </View>;
}
