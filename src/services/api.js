// Word help always uses Datamuse; classify and summarize can use the local demo.
import { API_URL, USE_MOCK } from '../constants/config';
const friendlyError = "Can't reach the server. Check Wi-Fi and the server address.";
async function post(path, body) {
  try {
    const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(friendlyError);
    return response.json();
  } catch { throw new Error(friendlyError); }
}
export async function suggest(typed) {
  const word = typed.trim();
  if (!word) return [];
  try {
    const [sounds, spelled] = await Promise.all([
      fetch(`https://api.datamuse.com/words?sl=${encodeURIComponent(word)}&max=5`).then((r) => r.json()),
      fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=5`).then((r) => r.json()),
    ]);
    const words = [...new Set([...sounds, ...spelled].map((item) => item.word).filter(Boolean))];
    return words.slice(0, 5).length ? words.slice(0, 5) : ['bed', 'bad', 'bat'];
  } catch { return ['bed', 'bad', 'bat']; }
}
export async function classify(intended, typed) {
  if (!USE_MOCK) return post('/classify', { intended, typed });
  const a = intended.toLowerCase(); const b = typed.toLowerCase(); let label = 'other';
  if (a.length === b.length) {
    if ([['b', 'd'], ['d', 'b'], ['p', 'q'], ['q', 'p']].some(([x, y]) => a.split('').some((letter, i) => letter === x && b[i] === y))) label = 'reversal';
    else { const different = [...a].map((letter, i) => letter !== b[i] ? i : -1).filter((i) => i >= 0); if (different.length === 2 && a[different[0]] === b[different[1]] && a[different[1]] === b[different[0]]) label = 'transposition'; }
  } else if (a.length - b.length === 1 && [...a].some((_, i) => a.slice(0, i) + a.slice(i + 1) === b)) label = 'omission';
  else if (a.replace(/(.)\1/g, '$1') === b.replace(/(.)\1/g, '$1')) label = 'phonetic';
  const labels = ['reversal', 'transposition', 'omission', 'phonetic', 'other'];
  const probabilities = Object.fromEntries(labels.map((item) => [item, item === label ? 0.9 : 0.025]));
  const features = {
    len_diff: b.length - a.length,
    same_letters: Number([...a].sort().join('') === [...b].sort().join('')),
    n_replace: 0, n_delete: Math.max(0, a.length - b.length), n_insert: Math.max(0, b.length - a.length),
    mirror_swaps: label === 'reversal' ? 1 : 0,
    mismatches: [...a].filter((letter, index) => letter !== b[index]).length,
    sound_match: Number(label === 'phonetic'), similarity: 0, first_letter_same: Number(a[0] === b[0]),
  };
  features.similarity = Math.round((1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length)) * 100) / 100;
  return {
    ok: true, intended: a, typed: b, label, confidence: 0.9, probabilities, clues: features,
    reasons: [label === 'omission' ? 'The typed word is shorter than the word you meant.' : 'The words have a spelling pattern the demo recognises.'],
    top_clues_overall: ['similarity', 'len_diff', 'sound_match'], warnings: [],
  };
}
export async function summarize(text) {
  if (!USE_MOCK) return (await post('/summarize', { text })).bullets;
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean).slice(0, 3) || [];
}

export async function generatePractice(text, count, difficulty, types, ageBand = 'general') {
  if (!USE_MOCK) return post('/study', { text, count, difficulty, types, ageBand });
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
  if (!sentences.length || !types.length) throw new Error('Add some notes and choose at least one question type.');
  const flashcards = Array.from({ length: count }, (_, index) => ({ front: 'What does the text say?', back: sentences[index % sentences.length] }));
  const questions = Array.from({ length: count }, (_, index) => {
    const type = types[index % types.length];
    const fact = sentences[index % sentences.length];
    if (type === 'multiple_choice') {
      const answer_index = index % 4;
      const options = [...new Set(sentences.filter((sentence) => sentence !== fact))].slice(0, 3);
      ['The text does not mention this detail.', 'This detail is not stated in the text.', 'The text gives no information about this.'].forEach((option) => { if (options.length < 3 && !options.includes(option)) options.push(option); });
      options.splice(answer_index, 0, fact);
      return { type, question: 'Which statement matches the text?', options: options.slice(0, 4), answer_index, answer: fact, explanation: `The text states: ${fact}` };
    }
    if (type === 'true_false') {
      const isTrue = index % 2 === 0;
      return { type, question: isTrue ? `The text says: ${fact}` : `The text says this did not happen: ${fact}`, options: ['True', 'False', 'Not stated', 'I am not sure'], answer_index: isTrue ? 0 : 1, answer: isTrue ? 'True' : 'False', explanation: `The text states: ${fact}` };
    }
    return { type, question: 'What fact does the text give?', options: [], answer_index: null, answer: fact, explanation: 'This answer repeats a fact from the text.' };
  });
  return { flashcards, questions, difficulty };
}
