// Read tab: simplify the visual layout and read text aloud.
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Screen, BodyText, ActionButton, InputBox, AudioControls } from '../components/AppUI';
import ReadableText from '../components/ReadableText';
import SettingsPanel from '../components/SettingsPanel';
import { useSettings } from '../context/SettingsContext';
import { recordTextRead } from '../services/progress';
import { getSpeechVoices, NO_VOICE_MESSAGE } from '../services/speech';
import { useToast } from '../context/ToastContext';

export default function ReadScreen() {
  const [input, setInput] = useState(''); const [shown, setShown] = useState(''); const [line, setLine] = useState(0); const [word, setWord] = useState(-1); const [open, setOpen] = useState(false); const [voiceMessage, setVoiceMessage] = useState(''); const { colors } = useSettings(); const showToast = useToast();
  useEffect(() => { let active = true; getSpeechVoices().then((voices) => { if (active && !voices.length) setVoiceMessage(NO_VOICE_MESSAGE); }).catch((error) => { console.error('Could not check speech voices:', error); if (active) showToast('Could not check the device speech voices.'); }); return () => { active = false; }; }, [showToast]);
  const count = Math.ceil(shown.trim().split(/\s+/).filter(Boolean).length / 9);
  return <Screen title="Read"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
    <InputBox value={input} onChangeText={setInput} placeholder="Paste or type text here" multiline />
    <ActionButton label="Make it easy to read" onPress={() => { setShown(input); setLine(0); if (input.trim()) recordTextRead().catch(() => {}); }} />
    {voiceMessage ? <BodyText style={{ marginBottom: 12 }}>{voiceMessage}</BodyText> : null}
    {shown ? <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 12, marginTop: 14 }}><ReadableText text={shown} highlightedLine={line} highlightedWordIndex={word} /><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><ActionButton label="Previous line" secondary onPress={() => setLine(Math.max(0, line - 1))} /><ActionButton label="Next line" secondary onPress={() => setLine(Math.min(Math.max(0, count - 1), line + 1))} /></View><AudioControls text={shown} onWordIndex={setWord} onNoStart={() => setVoiceMessage(NO_VOICE_MESSAGE)} /></View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Toggle display settings" onPress={() => setOpen(!open)} style={{ minHeight: 52, justifyContent: 'center', marginTop: 16 }}><BodyText>{open ? '▾' : '▸'} Display settings</BodyText></Pressable>
    {open ? <SettingsPanel /> : null}
  </ScrollView></Screen>;
}
