// Write tab: suggests likely spellings and tracks practice patterns.
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, BodyText, ActionButton, InputBox, ErrorMessage, confirmReset } from '../../components/AppUI';
import { classify, suggest } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { speakText } from '../../services/speech';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';

const explanations = { reversal: ['You flipped a letter that looks like its mirror, like b and d.', 'swap-horizontal-outline'], transposition: ['Two letters next to each other swapped places.', 'swap-horizontal'], omission: ['A letter is missing.', 'remove-circle-outline'], phonetic: ['You spelled it how it sounds.', 'musical-notes-outline'], other: ["This mistake doesn't fit a common pattern. Check the word again.", 'help-circle-outline'] };
const blankTally = { reversal: 0, transposition: 0, omission: 0, phonetic: 0, other: 0 };
export default function WriteScreen() {
  const [typed, setTyped] = useState(''); const [words, setWords] = useState([]); const [result, setResult] = useState(null); const [tally, setTally] = useState(blankTally); const [message, setMessage] = useState(''); const { colors } = useSettings(); const showToast = useToast();
  useEffect(() => { AsyncStorage.getItem('practice-tally').then((saved) => { if (saved) setTally({ ...blankTally, ...JSON.parse(saved) }); }).catch(() => {}); }, []);
  const findWords = async () => { setMessage(''); setResult(null); if (!typed.trim()) { setMessage('Type a word first, and we will look together.'); return; } setWords(await suggest(typed)); };
  const choose = async (intended) => {
    try { const found = await classify(intended, typed.trim()); setResult({ ...found, intended }); const next = { ...tally, [found.label]: (tally[found.label] || 0) + 1 }; setTally(next); AsyncStorage.setItem('practice-tally', JSON.stringify(next)).catch(() => {}); }
    catch { setMessage("Can't reach the server. Check Wi-Fi and the server address."); }
  };
  return <Screen title="Write"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
    <InputBox value={typed} onChangeText={setTyped} placeholder="Type the word the way you think it is spelled" />
    <ActionButton label="Find my word" onPress={findWords} />{message ? <ErrorMessage>{message}</ErrorMessage> : null}
    {words.length ? <><BodyText style={{ marginTop: 12 }}>Did you mean...?</BodyText><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{words.map((word) => <Pressable key={word} accessibilityRole="button" accessibilityLabel={`Choose ${word}`} onPress={() => choose(word)} style={{ minHeight: 52, minWidth: 88, paddingHorizontal: 16, backgroundColor: colors.soft, borderRadius: 20, justifyContent: 'center', alignItems: 'center', margin: 5 }}><Text style={{ color: colors.text, fontSize: 20 }}>{word}</Text></Pressable>)}</View></> : null}
    {result ? <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 16, marginTop: 14 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name={explanations[result.label]?.[1]} size={24} color={colors.accent} style={{ marginRight: 8 }} /><BodyText style={{ fontSize: 24 }}>{result.label[0].toUpperCase() + result.label.slice(1)}</BodyText></View><BodyText>{explanations[result.label]?.[0]}</BodyText><BodyText style={{ marginTop: 8 }}>Example: {typed.trim()} to {result.intended}</BodyText><BodyText>Confidence: {Math.round(result.confidence * 100)}%</BodyText><ActionButton label="Hear the word" icon="volume-high-outline" onPress={() => speakText(result.intended, { onError: () => showToast('Speech could not start. Check that a voice is installed.') })} /></View> : null}
    <View style={{ marginTop: 20 }}><BodyText style={{ fontSize: 24 }}>My practice</BodyText>{Object.entries(tally).map(([type, value]) => <BodyText key={type}>{type[0].toUpperCase() + type.slice(1)}: {value}</BodyText>)}<ActionButton label="Reset practice" secondary onPress={() => confirmReset(() => { setTally(blankTally); AsyncStorage.setItem('practice-tally', JSON.stringify(blankTally)).catch(() => {}); })} /></View>
  </ScrollView></Screen>;
}
