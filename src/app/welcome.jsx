// Entry page for local accounts, Supabase accounts, and guest sessions.
import React from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Screen, BodyText, ActionButton } from '../components/AppUI';
import { useAuth } from '../context/AuthContext';

export default function WelcomeScreen() {
  const { continueAsGuest } = useAuth();
  return <Screen title="Read Easy"><ScrollView contentContainerStyle={{ paddingBottom: 30 }}><BodyText style={{ marginBottom: 24 }}>Read, understand, and study at your own pace.</BodyText><ActionButton label="Create account" icon="person-add-outline" onPress={() => router.push('/sign-up')} /><ActionButton label="Sign in" icon="log-in-outline" secondary onPress={() => router.push('/sign-in')} /><ActionButton label="Continue as guest" icon="person-outline" secondary onPress={() => continueAsGuest()} /></ScrollView></Screen>;
}
