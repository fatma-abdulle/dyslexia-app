// Spelling helper with readable model explanations and local practice tracking.
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Screen, BodyText, ActionButton, InputBox, ErrorMessage, confirmReset } from '../../components/AppUI';
import { classify, suggest } from '../../services/api';
import { USE_MOCK } from '../../constants/config';
import { useSettings } from '../../context/SettingsContext';
import { speakText } from '../../services/speech';
import { useToast } from '../../context/ToastContext';

const TYPES = ['reversal', 'transposition', 'omission', 'phonetic', 'other'];
const DETAILS = {
  reversal: ['You flipped a letter that looks like its mirror, like b and d.', 'swap-horizontal-outline'],
  transposition: ['Two letters next to each other swapped places.', 'swap-horizontal'],
  omission: ['A letter is missing.', 'remove-circle-outline'],
  phonetic: ['You spelled it how it sounds.', 'volume-high-outline'],
  other: ["This mistake doesn't fit a common pattern. Check the word again.", 'help-circle-outline'],
};
const CLUE_TEXT = { len_diff: 'Length difference', same_letters: 'Same letters', n_replace: 'Letter replacements', n_delete: 'Letters removed', n_insert: 'Letters added', mirror_swaps: 'Mirror letter swaps', mismatches: 'Different positions', sound_match: 'Sound match', similarity: 'Spelling similarity', first_letter_same: 'First letter matches' };
const EXAMPLES = [['bed', 'ded'], ['form', 'from'], ['friend', 'frend'], ['phone', 'fone'], ['accordingly', 'o']];
const EMPTY_TALLY = { reversal: 0, transposition: 0, omission: 0, phonetic: 0, other: 0 };

function Bar({ value, colors }) {
  return <View style={{ height: 12, backgroundColor: colors.soft, borderRadius: 8, overflow: 'hidden', marginVertical: 5 }}><View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: colors.accent }} /></View>;
}

export default function WriteScreen() {
  const [typed, setTyped] = useState(''); const [intended, setIntended] = useState('');
  const [words, setWords] = useState([]); const [result, setResult] = useState(null);
  const [tally, setTally] = useState(EMPTY_TALLY); const [message, setMessage] = useState('');
  const [howOpen, setHowOpen] = useState(false); const { colors } = useSettings(); const showToast = useToast();
  useEffect(() => { AsyncStorage.getItem('practice-tally').then((saved) => { if (saved) setTally({ ...EMPTY_TALLY, ...JSON.parse(saved) }); }).catch(() => {}); }, []);

  const validate = () => {
    if (!intended.trim() || !typed.trim()) return 'Please fill in both the word you meant and the word you wrote.';
    if (/\s/.test(intended) || /\s/.test(typed)) return 'Please enter one word at a time, without spaces.';
    if (!/^[a-z]+$/i.test(intended) || !/^[a-z]+$/i.test(typed)) return 'Please use letters only, from a to z.';
    return '';
  };
  const checkPair = async (correct = intended, written = typed) => {
    setMessage(''); setResult(null);
    const problem = (!/^[a-z]+$/i.test(correct) || !/^[a-z]+$/i.test(written) || /\s/.test(correct) || /\s/.test(written))
      ? (!correct.trim() || !written.trim() ? 'Please fill in both words.' : /\s/.test(correct) || /\s/.test(written) ? 'Please enter one word at a time, without spaces.' : 'Please use letters only, from a to z.')
      : '';
    if (problem) { setMessage(problem); return; }
    try {
      const found = await classify(correct, written);
      if (!found.ok) { setMessage(found.message || 'Please check both words and try again.'); return; }
      setResult(found);
      const next = { ...tally, [found.label]: (tally[found.label] || 0) + 1 }; setTally(next);
      AsyncStorage.setItem('practice-tally', JSON.stringify(next)).catch(() => {});
    } catch (error) { setMessage(error.message || "Can't reach the server. Check Wi-Fi and the server address."); }
  };
  const findWords = async () => {
    const problem = validate();
    if (!typed.trim()) { setMessage('Type the word the way you think it is spelled first.'); return; }
    if (problem && intended.trim()) { setMessage(problem); return; }
    if (/[\s]/.test(typed) || !/^[a-z]+$/i.test(typed)) { setMessage('Please enter one word using letters only.'); return; }
    setMessage(''); setWords(await suggest(typed));
  };
  const selectExample = (correct, written) => { setIntended(correct); setTyped(written); setWords([]); setMessage(''); checkPair(correct, written); };
  const chip = (word, onPress, label) => <Pressable key={label || word} accessibilityRole="button" accessibilityLabel={label || `Choose ${word}`} onPress={onPress} style={{ minHeight: 52, minWidth: 82, paddingHorizontal: 14, backgroundColor: colors.soft, borderRadius: 16, justifyContent: 'center', alignItems: 'center', margin: 4 }}><BodyText>{word}</BodyText></Pressable>;

  return <Screen title="Spelling"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
    {USE_MOCK ? <BodyText style={{ color: colors.muted, marginBottom: 8 }}>Demo mode, not the real model</BodyText> : null}
    <BodyText>The word you meant</BodyText><InputBox value={intended} onChangeText={setIntended} placeholder="Enter the correct word" accessibilityLabel="The word you meant" />
    <BodyText style={{ marginTop: 8 }}>The word you wrote</BodyText><InputBox value={typed} onChangeText={setTyped} placeholder="Type the word the way you think it is spelled" accessibilityLabel="The word you wrote" />
    <ActionButton label="Check these words" onPress={() => checkPair()} />
    <ActionButton label="Find my word" secondary onPress={findWords} />{message ? <ErrorMessage>{message}</ErrorMessage> : null}
    {words.length ? <><BodyText style={{ marginTop: 10 }}>Did you mean...?</BodyText><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{words.map((word) => chip(word, () => { setIntended(word); checkPair(word, typed); }, `Check ${word}`))}</View></> : null}
    <BodyText style={{ marginTop: 14 }}>Quick examples</BodyText><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{EXAMPLES.map(([a, b]) => chip(`${a} / ${b}`, () => selectExample(a, b), `Try ${a} written as ${b}`))}</View>
    {result ? <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 18, marginTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name={DETAILS[result.label]?.[1] || 'help-circle-outline'} size={28} color={colors.accent} style={{ marginRight: 9 }} /><BodyText style={{ fontSize: 26 }}>{result.label[0].toUpperCase() + result.label.slice(1)}</BodyText></View>
      <BodyText>{DETAILS[result.label]?.[0]}</BodyText>
      <BodyText style={{ marginTop: 8 }}>Example: {result.typed} to {result.intended}</BodyText>
      <BodyText>Confidence: {Math.round(result.confidence * 100)}%</BodyText><Bar value={result.confidence * 100} colors={colors} />
      {(result.warnings || []).map((warning) => <BodyText key={warning} style={{ backgroundColor: colors.soft, padding: 10, borderRadius: 10, marginTop: 6 }}>Note: {warning}</BodyText>)}
      <BodyText style={{ fontSize: 23, marginTop: 12 }}>Why this result?</BodyText>
      {(result.reasons || []).map((reason, index) => <BodyText key={`${index}-${reason}`} style={{ marginTop: 5 }}>• {reason}</BodyText>)}
      <BodyText style={{ marginTop: 10 }}>Share of trees that voted for this</BodyText>
      {TYPES.map((type) => <View key={type} style={{ marginTop: 6 }}><BodyText>{type[0].toUpperCase() + type.slice(1)}: {Math.round((result.probabilities?.[type] || 0) * 100)}%</BodyText><Bar value={(result.probabilities?.[type] || 0) * 100} colors={colors} /></View>)}
      <BodyText style={{ marginTop: 10 }}>Top clues the model relies on</BodyText>
      {(result.top_clues_overall || []).slice(0, 3).map((clue) => <BodyText key={clue}>• {CLUE_TEXT[clue] || clue}: {String(result.clues?.[clue] ?? '')}</BodyText>)}
      <ActionButton label="Hear the word" icon="volume-high-outline" onPress={() => speakText(result.intended, { onError: () => showToast('Speech could not start. Check that a voice is installed.') })} />
    </View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="How it works" onPress={() => setHowOpen(!howOpen)} style={{ minHeight: 52, justifyContent: 'center', marginTop: 14 }}><BodyText>How it works {howOpen ? '−' : '+'}</BodyText></Pressable>
    {howOpen ? <View style={{ backgroundColor: colors.card, padding: 14, borderRadius: 14 }}><BodyText>The app cleans the words, turns them into 10 numbers, and 100 decision trees vote. The share of votes is the confidence.</BodyText></View> : null}
    <View style={{ marginTop: 20 }}><BodyText style={{ fontSize: 24 }}>My practice</BodyText>{Object.entries(tally).map(([type, value]) => <BodyText key={type}>{type[0].toUpperCase() + type.slice(1)}: {value}</BodyText>)}<ActionButton label="Reset practice" secondary onPress={() => confirmReset(() => { setTally(EMPTY_TALLY); AsyncStorage.setItem('practice-tally', JSON.stringify(EMPTY_TALLY)).catch(() => {}); })} /></View>
  </ScrollView></Screen>;
}
