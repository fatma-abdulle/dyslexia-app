// Sends a returning user to the app or a signed-out learner to Welcome.
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function IndexRoute() {
  const { loading, isAllowed } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  return <Redirect href={isAllowed ? '/(tabs)' : '/welcome'} />;
}
