// Groups the learning tools under one labelled bottom tab bar.
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';
import { recordAppDay } from '../../services/progress';

export default function TabsLayout() {
  const { colors } = useSettings();
  useEffect(() => { recordAppDay().catch(() => {}); }, []);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.text, tabBarStyle: { backgroundColor: colors.card, height: 74, paddingTop: 8, paddingBottom: 8 }, tabBarLabelStyle: { fontSize: 14, fontFamily: 'Lexend_400Regular' } }}>
    <Tabs.Screen name="index" options={{ title: 'Read', tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} /> }} />
    <Tabs.Screen name="write" options={{ title: 'Spelling', tabBarIcon: ({ color }) => <Ionicons name="create-outline" size={22} color={color} /> }} />
    <Tabs.Screen name="words" options={{ title: 'Words', tabBarIcon: ({ color }) => <Ionicons name="bookmark-outline" size={22} color={color} /> }} />
    <Tabs.Screen name="summary" options={{ title: 'Summarise', tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} /> }} />
    <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} /> }} />
  </Tabs>;
}
