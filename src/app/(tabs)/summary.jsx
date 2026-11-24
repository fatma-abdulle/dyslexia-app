// Summarise tab: turns notes into a few readable points and speaks them aloud.
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, ActionButton, InputBox, ErrorMessage, Loading, AudioControls } from '../../components/AppUI';
import ReadableText from '../../components/ReadableText';
import { summarize } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import PracticeSection from '../../components/PracticeSection';

export default function SummaryScreen() {
  const [input, setInput] = useState(''); const [bullets, setBullets] = useState([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const { colors } = useSettings();
  const run = async () => {
    setMessage(''); setBullets([]);
    if (!input.trim()) { setMessage('Add a few notes first, then we can find the main ideas.'); return; }
    setBusy(true); try { const result = await summarize(input); setBullets(result); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  return <Screen title="Summarise"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}><InputBox value={input} onChangeText={setInput} placeholder="Paste your notes" multiline /><ActionButton label="Summarise" icon="document-text-outline" onPress={run} />{busy ? <Loading /> : null}{message ? <ErrorMessage>{message}</ErrorMessage> : null}{bullets.length ? <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 12 }}>{bullets.map((bullet, index) => <View key={`${index}-${bullet}`} style={{ flexDirection: 'row', marginBottom: 8 }}><Ionicons name="ellipse" size={10} color={colors.accent} style={{ marginTop: 10, marginRight: 10 }} /><View style={{ flex: 1 }}><ReadableText text={bullet} /></View></View>)}<AudioControls text={bullets.join('. ')} /></View> : null}<PracticeSection text={bullets.length ? bullets.join(' ') : input} /></ScrollView></Screen>;
}
