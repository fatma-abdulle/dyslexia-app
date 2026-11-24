// Signs a learner in with Supabase or a local demo account.
import React, { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, BodyText, ActionButton, InputBox, ErrorMessage } from '../components/AppUI';
import { useAuth } from '../context/AuthContext';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try { await signIn(email, password); router.replace('/(tabs)'); }
    catch (issue) { setError(issue.message); } finally { setBusy(false); }
  };
  return <Screen title="Sign in"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}><InputBox value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" /><InputBox value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="current-password" /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} style={{ minHeight: 48, justifyContent: 'center' }}><BodyText>{showPassword ? 'Hide password' : 'Show password'}</BodyText></Pressable>{error ? <ErrorMessage>{error}</ErrorMessage> : null}<ActionButton label={busy ? 'Signing in...' : 'Sign in'} onPress={submit} disabled={busy} /><ActionButton label="Back to welcome" secondary onPress={() => router.replace('/welcome')} /></ScrollView></Screen>;
}
