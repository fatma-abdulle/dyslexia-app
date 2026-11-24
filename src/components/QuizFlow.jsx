// Reusable question flow with calm feedback, missed-answer review, and local scores.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, BodyText, ErrorMessage } from './AppUI';
import { useSettings } from '../context/SettingsContext';
import { saveQuizScore } from '../services/progress';

function timeLabel(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function QuizFlow({ questions, timerEnabled }) {
  const { colors } = useSettings();
  const startSeconds = Math.max(90, questions.length * 60);
  const secondsRef = useRef(startSeconds);
  const [items, setItems] = useState(questions); const [answers, setAnswers] = useState(questions.map(() => null)); const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState(null); const [revealed, setRevealed] = useState(false); const [review, setReview] = useState(false); const [secondsLeft, setSecondsLeft] = useState(startSeconds); const [timeUp, setTimeUp] = useState(false); const [saveError, setSaveError] = useState('');
  const question = items[index];
  const missed = items.filter((_, itemIndex) => answers[itemIndex] !== true);

  useEffect(() => {
    if (!timerEnabled || review || timeUp) return undefined;
    const timer = setInterval(() => {
      const next = Math.max(0, secondsRef.current - 1);
      secondsRef.current = next;
      setSecondsLeft(next);
      if (next === 0) setTimeUp(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerEnabled, review, timeUp]);

  const complete = async (nextAnswers = answers, currentItems = items) => {
    const score = nextAnswers.filter((answer) => answer === true).length;
    setSaveError('');
    try { await saveQuizScore(score, currentItems.length); }
    catch { setSaveError('Your score could not be saved on this device.'); }
    setAnswers(nextAnswers); setReview(true);
  };

  const recordAnswer = (isCorrect) => {
    const next = [...answers]; next[index] = isCorrect; setAnswers(next);
    setFeedback({ isCorrect, explanation: question.explanation });
  };

  const continueNext = () => {
    if (timeUp || index + 1 >= items.length) { complete(); return; }
    setIndex(index + 1); setFeedback(null); setRevealed(false);
  };

  const retryMissed = () => {
    const retry = [...missed];
    setItems(retry); setAnswers(retry.map(() => null)); setIndex(0); setFeedback(null); setRevealed(false); setReview(false); setTimeUp(false); secondsRef.current = Math.max(90, retry.length * 60); setSecondsLeft(secondsRef.current);
  };

  if (!items.length) return null;
  if (review) return <View style={{ marginTop: 18 }}>
    <BodyText style={{ fontSize: 24 }}>Review your answers</BodyText>
    <BodyText>You got {answers.filter((answer) => answer === true).length} of {items.length} right.</BodyText>
    {missed.length ? missed.map((item, itemIndex) => <View key={`${itemIndex}-${item.question}`} style={{ padding: 12, backgroundColor: colors.card, borderRadius: 12, marginTop: 10 }}><BodyText>{item.question}</BodyText><BodyText>Answer: {item.answer}</BodyText><BodyText>{item.explanation}</BodyText></View>) : <BodyText>Every answer was right. Nice work.</BodyText>}
    {saveError ? <ErrorMessage>{saveError}</ErrorMessage> : null}
    {missed.length ? <ActionButton label="Retry missed questions" icon="refresh-outline" onPress={retryMissed} /> : null}
  </View>;

  if (!question) return null;
  const isShortAnswer = question.type === 'short_answer';
  const chooseOption = (optionIndex) => recordAnswer(optionIndex === question.answer_index);
  return <View style={{ marginTop: 18 }}>
    <BodyText style={{ fontSize: 24 }}>Quiz</BodyText>
    {timerEnabled ? <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="time-outline" size={20} color={colors.text} style={{ marginRight: 8 }} /><BodyText>Time left: {timeLabel(secondsLeft)}</BodyText></View> : null}
    {timeUp ? <BodyText style={{ marginVertical: 8 }}>Time is up. Finish this question, then review your answers.</BodyText> : null}
    <BodyText style={{ marginVertical: 8 }}>Question {index + 1} of {items.length}</BodyText>
    <View style={{ padding: 14, backgroundColor: colors.card, borderRadius: 14 }}><BodyText>{question.question}</BodyText></View>
    {isShortAnswer ? <>
      {!revealed ? <ActionButton label="Show answer" icon="eye-outline" secondary onPress={() => setRevealed(true)} /> : <View style={{ padding: 12, backgroundColor: colors.card, borderRadius: 12, marginTop: 8 }}><BodyText>Answer: {question.answer}</BodyText><BodyText>{question.explanation}</BodyText></View>}
      {revealed && !feedback ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><ActionButton label="I got it" icon="checkmark-circle-outline" onPress={() => recordAnswer(true)} /><ActionButton label="Not yet" icon="help-circle-outline" secondary onPress={() => recordAnswer(false)} /></View> : null}
    </> : question.options.map((option, optionIndex) => <Pressable key={`${optionIndex}-${option}`} accessibilityRole="button" accessibilityLabel={`Answer ${option}`} disabled={Boolean(feedback)} onPress={() => chooseOption(optionIndex)} style={{ minHeight: 60, justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.soft, marginTop: 8 }}><BodyText>{option}</BodyText></Pressable>)}
    {feedback ? <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: colors.soft, flexDirection: 'row' }}><Ionicons name={feedback.isCorrect ? 'checkmark-circle-outline' : 'information-circle-outline'} size={24} color={colors.accent} style={{ marginRight: 8 }} /><View style={{ flex: 1 }}><BodyText>{feedback.isCorrect ? 'That is right.' : 'Not yet. Read the explanation and keep going.'}</BodyText><BodyText>{feedback.explanation}</BodyText></View></View> : null}
    {feedback ? <ActionButton label={index + 1 === items.length || timeUp ? 'See review' : 'Next question'} icon="arrow-forward-outline" onPress={continueNext} /> : null}
  </View>;
}
