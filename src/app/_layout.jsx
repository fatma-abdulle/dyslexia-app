// Loads app fonts and guards the private learning tabs behind a local or Supabase session.
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts, Lexend_400Regular, Lexend_600SemiBold } from '@expo-google-fonts/lexend';
import { SettingsProvider } from '../context/SettingsContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

function GuardedStack() {
  const { loading, isAllowed } = useAuth();
  const segments = useSegments();
  const first = segments[0];
  const publicRoute = ['welcome', 'sign-in', 'sign-up'].includes(first);
  useEffect(() => {
    if (loading) return;
    if (!isAllowed && !publicRoute) router.replace('/welcome');
    if (isAllowed && publicRoute) router.replace('/(tabs)');
  }, [isAllowed, loading, publicRoute]);
  if (loading || (!isAllowed && !publicRoute)) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="index" /><Stack.Screen name="welcome" /><Stack.Screen name="sign-in" /><Stack.Screen name="sign-up" /><Stack.Screen name="(tabs)" /></Stack>;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Lexend_400Regular, Lexend_600SemiBold });
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  return <SettingsProvider><ToastProvider><AuthProvider><GuardedStack /></AuthProvider></ToastProvider></SettingsProvider>;
}
