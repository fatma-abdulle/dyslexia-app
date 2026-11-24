// A small saved-word detail card with speech shared across the app.
import React from 'react';
import { View } from 'react-native';
import { ActionButton, BodyText } from './AppUI';
import { useToast } from '../context/ToastContext';
import { speakText } from '../services/speech';

export default function WordExplainer({ entry }) {
  const showToast = useToast();
  const word = typeof entry === 'string' ? entry : entry?.word || '';
  if (!word) return null;
  return <View><BodyText style={{ fontSize: 24 }}>{word}</BodyText>{entry?.simple_explanation ? <BodyText>{entry.simple_explanation}</BodyText> : null}<ActionButton label="Hear this word" onPress={() => speakText(word, { onError: () => showToast('Speech could not start. Check that a voice is installed.') })} /></View>;
}
