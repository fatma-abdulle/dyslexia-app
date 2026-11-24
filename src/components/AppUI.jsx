// Shared screen layout, accessible buttons, and speech controls.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { NO_VOICE_MESSAGE, speakText, stopSpeech } from '../services/speech';

export function Screen({ title, children }) {
  const { colors } = useSettings();
  return <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 18 }}><Text style={{ fontSize: 30, color: colors.text, fontFamily: 'Lexend_600SemiBold', marginBottom: 16 }}>{title}</Text>{children}</View>;
}
export function BodyText({ children, style = {} }) {
  const { colors, settings } = useSettings();
  return <Text style={{ color: colors.text, fontFamily: 'Lexend_400Regular', fontSize: Math.max(18, settings.fontSize), lineHeight: settings.fontSize * settings.lineSpacing, letterSpacing: settings.letterSpacing, ...style }}>{children}</Text>;
}
export function ActionButton({ label, onPress, secondary = false, disabled = false }) {
  const { colors } = useSettings();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{ minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, marginVertical: 6, backgroundColor: secondary ? colors.soft : colors.accent, opacity: disabled ? 0.55 : 1 }}><Text style={{ fontSize: 18, color: secondary ? colors.text : colors.background, fontFamily: 'Lexend_600SemiBold' }}>{label}</Text></Pressable>;
}
export function InputBox({ value, onChangeText, placeholder, multiline = false, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'sentences', autoComplete }) {
  const { colors } = useSettings();
  return <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.text + '99'} multiline={multiline} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoComplete={autoComplete} textAlignVertical={multiline ? 'top' : 'center'} style={{ minHeight: multiline ? 140 : 56, borderWidth: 1, borderColor: colors.accent, borderRadius: 14, padding: 14, backgroundColor: colors.card, color: colors.text, fontFamily: 'Lexend_400Regular', fontSize: 18, lineHeight: 29, marginBottom: 10 }} />;
}
export function AudioControls({ text, onWordIndex, onNoStart }) {
  const [speed, setSpeed] = useState(1);
  const [reading, setReading] = useState(false);
  const showToast = useToast();
  const startTimer = useRef(null);
  const wordTimer = useRef(null);
  const boundarySeen = useRef(false);
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const clearTimers = () => { clearTimeout(startTimer.current); clearInterval(wordTimer.current); };
  useEffect(() => () => { clearTimers(); }, []);
  const speak = () => {
    if (!words.length) return;
    clearTimers(); boundarySeen.current = false;
    setReading(true);
    if (Platform.OS === 'android') startTimer.current = setTimeout(() => { showToast(NO_VOICE_MESSAGE); onNoStart?.(); }, 3000);
    speakText(text, {
      rate: speed,
      onStart: () => {
        clearTimeout(startTimer.current);
        wordTimer.current = setInterval(() => {
          if (!boundarySeen.current) onWordIndex?.((index) => Math.min(words.length - 1, index + 1));
        }, Math.max(260, 600 / speed));
      },
      onBoundary: (event) => {
        boundarySeen.current = true; clearInterval(wordTimer.current);
        if (Number.isFinite(event?.charIndex)) onWordIndex?.(words.slice(0, text.slice(0, event.charIndex).trim().split(/\s+/).filter(Boolean).length).length);
      },
      onDone: () => { clearTimers(); setReading(false); },
      onStopped: () => { clearTimers(); setReading(false); },
      onError: () => { clearTimers(); setReading(false); showToast('Speech could not start. Check that a voice is installed.'); },
    });
  };
  const stop = () => { clearTimers(); stopSpeech(); setReading(false); };
  return <View style={{ marginTop: 12 }}><BodyText>{reading ? 'Reading...' : 'Stopped'}</BodyText><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><ActionButton label="Play" onPress={speak} /><ActionButton label="Stop" secondary onPress={stop} /><ActionButton label={`Speed: ${speed === 0.75 ? 'Slow' : 'Normal'}`} secondary onPress={() => setSpeed(speed === 0.75 ? 1 : 0.75)} /></View></View>;
}
export function ErrorMessage({ children }) { return <BodyText style={{ color: '#8B3F35', marginVertical: 8 }}>{children}</BodyText>; }
export function Loading() { const { colors } = useSettings(); return <ActivityIndicator accessibilityLabel="Loading" size="large" color={colors.accent} style={{ margin: 16 }} />; }
export function confirmReset(onReset) { Alert.alert('Reset practice?', 'This clears your saved practice counts.', [{ text: 'Keep counts', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: onReset }]); }
