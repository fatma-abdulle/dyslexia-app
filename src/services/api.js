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
  return { label, confidence: 0.9 };
}
export async function summarize(text) {
  if (!USE_MOCK) return (await post('/summarize', { text })).bullets;
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean).slice(0, 3) || [];
}
