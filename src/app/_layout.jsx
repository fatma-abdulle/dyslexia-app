// Loads Lexend, shares settings, and defines the three labelled app tabs.
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useFonts, Lexend_400Regular, Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import { ActivityIndicator, View, Text } from 'react-native';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { recordAppDay } from '../services/progress';
import { ToastProvider } from '../context/ToastContext';

function TabShell() {
  const { colors } = useSettings();
  useEffect(() => { recordAppDay().catch(() => {}); }, []);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.text, tabBarStyle: { backgroundColor: colors.card, height: 74, paddingTop: 8, paddingBottom: 8 }, tabBarLabelStyle: { fontSize: 14, fontFamily: 'Lexend_400Regular' } }}>
    <Tabs.Screen name="index" options={{ title: 'Read', tabBarIcon: () => <Text style={{ fontSize: 22 }}>▤</Text> }} />
    <Tabs.Screen name="write" options={{ title: 'Write', tabBarIcon: () => <Text style={{ fontSize: 22 }}>✎</Text> }} />
    <Tabs.Screen name="words" options={{ title: 'Words', tabBarIcon: () => <Text style={{ fontSize: 22 }}>Aa</Text> }} />
    <Tabs.Screen name="summary" options={{ title: 'Summarise', tabBarIcon: () => <Text style={{ fontSize: 22 }}>≡</Text> }} />
    <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: () => <Text style={{ fontSize: 22 }}>☺</Text> }} />
  </Tabs>;
}
export default function RootLayout() {
  const [loaded] = useFonts({ Lexend_400Regular, Lexend_600SemiBold });
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  return <SettingsProvider><ToastProvider><TabShell /></ToastProvider></SettingsProvider>;
}
