// Groups the learning tools under one labelled bottom tab bar.
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSettings } from '../../context/SettingsContext';
import { recordAppDay } from '../../services/progress';

export default function TabsLayout() {
  const { colors } = useSettings();
  useEffect(() => { recordAppDay().catch(() => {}); }, []);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.text, tabBarStyle: { backgroundColor: colors.card, height: 74, paddingTop: 8, paddingBottom: 8 }, tabBarLabelStyle: { fontSize: 14, fontFamily: 'Lexend_400Regular' } }}>
    <Tabs.Screen name="index" options={{ title: 'Read', tabBarIcon: () => <Text style={{ fontSize: 22 }}>Read</Text> }} />
    <Tabs.Screen name="write" options={{ title: 'Write', tabBarIcon: () => <Text style={{ fontSize: 22 }}>Write</Text> }} />
    <Tabs.Screen name="words" options={{ title: 'Words', tabBarIcon: () => <Text style={{ fontSize: 22 }}>Aa</Text> }} />
    <Tabs.Screen name="summary" options={{ title: 'Summarise', tabBarIcon: () => <Text style={{ fontSize: 22 }}>Notes</Text> }} />
    <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: () => <Text style={{ fontSize: 22 }}>Me</Text> }} />
  </Tabs>;
}
