// Words tab: reads saved word entries from local storage and speaks them.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, BodyText, Loading } from '../../components/AppUI';
import WordExplainer from '../../components/WordExplainer';
import { useSettings } from '../../context/SettingsContext';

export default function WordsScreen() {
  const [words, setWords] = useState(null);
  const { colors } = useSettings();
  const loadWords = useCallback(() => AsyncStorage.getItem('saved-words').then((stored) => setWords(stored ? JSON.parse(stored) : [])).catch(() => setWords([])), []);
  useEffect(() => { loadWords(); }, [loadWords]);
  return <Screen title="Words"><ScrollView contentContainerStyle={{ paddingBottom: 30 }}>{words === null ? <Loading /> : null}{words?.length ? words.map((entry, index) => <View key={`${typeof entry === 'string' ? entry : entry.word}-${index}`} style={{ padding: 14, marginBottom: 10, backgroundColor: colors.card, borderRadius: 14 }}><WordExplainer entry={entry} /></View>) : null}{words?.length === 0 ? <BodyText>Your saved words will appear here when you save one.</BodyText> : null}</ScrollView></Screen>;
}
