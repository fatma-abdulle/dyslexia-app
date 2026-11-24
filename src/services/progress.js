// Stores shareable progress locally on this device.
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS_KEY = 'progress-active-days';
const TEXTS_KEY = 'progress-texts-read';
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const today = () => dateKey(new Date());

export async function recordAppDay() {
  const saved = await AsyncStorage.getItem(DAYS_KEY);
  const days = saved ? JSON.parse(saved) : [];
  if (!days.includes(today())) await AsyncStorage.setItem(DAYS_KEY, JSON.stringify([...days, today()]));
}

export async function recordTextRead() {
  const count = Number(await AsyncStorage.getItem(TEXTS_KEY)) || 0;
  await AsyncStorage.setItem(TEXTS_KEY, String(count + 1));
}

export async function saveQuizScore(score, total) {
  const saved = await AsyncStorage.getItem('quiz-scores');
  const scores = saved ? JSON.parse(saved) : [];
  scores.push({ date: new Date().toISOString(), score, total, numberOfQuestions: total });
  await AsyncStorage.setItem('quiz-scores', JSON.stringify(scores.slice(-50)));
}

function currentStreak(days) {
  const dates = new Set(days);
  const cursor = new Date();
  if (!dates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function readFirst(keys, fallback) {
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) return value;
  }
  return fallback;
}

export async function getShareProgress() {
  const [dayData, textCount, wordsData, scoresData, errorsData] = await Promise.all([
    AsyncStorage.getItem(DAYS_KEY), AsyncStorage.getItem(TEXTS_KEY),
    readFirst(['saved-words', 'saved_words'], '[]'), readFirst(['quiz-scores', 'quiz_scores'], '[]'),
    AsyncStorage.getItem('practice-tally'),
  ]);
  const days = dayData ? JSON.parse(dayData) : [];
  const words = JSON.parse(wordsData || '[]');
  const scores = JSON.parse(scoresData || '[]');
  const errors = JSON.parse(errorsData || '{}');
  const commonErrors = Object.entries(errors).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    streak: currentStreak(days),
    textsRead: Number(textCount) || 0,
    wordsSaved: Array.isArray(words) ? words.length : Number(words) || 0,
    quizScores: Array.isArray(scores) ? scores.slice(-3).reverse() : [],
    commonErrors: commonErrors.filter(([, count]) => count > 0),
  };
}
