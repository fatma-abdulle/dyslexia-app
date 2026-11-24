// Wraps text into short readable lines and applies shared display preferences.
import React from 'react';
import { Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function ReadableText({ text, highlightedLine, highlightedWordIndex }) {
  const { settings, colors } = useSettings();
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  for (let i = 0; i < words.length; i += 9) lines.push(words.slice(i, i + 9));
  return <View accessibilityRole="text">{lines.map((line, index) => <Text key={`${index}-${line.join('-')}`} style={{ color: colors.text, fontFamily: 'Lexend_400Regular', fontSize: settings.fontSize, lineHeight: settings.fontSize * settings.lineSpacing, letterSpacing: settings.letterSpacing, textAlign: 'left', paddingHorizontal: 6, backgroundColor: highlightedLine === index ? colors.soft : 'transparent', marginBottom: 7 }}>{line.map((word, wordIndex) => { const absoluteIndex = index * 9 + wordIndex; return <Text key={`${absoluteIndex}-${word}`} style={{ backgroundColor: highlightedWordIndex === absoluteIndex ? colors.soft : 'transparent' }}>{word}{wordIndex < line.length - 1 ? ' ' : ''}</Text>; })}</Text>)}</View>;
}
