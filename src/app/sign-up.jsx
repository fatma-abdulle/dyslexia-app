// Creates a local demo account or a Supabase account with friendly validation.
import React, { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, BodyText, ActionButton, InputBox, ErrorMessage } from '../components/AppUI';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [showConfirm, setShowConfirm] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (!name.trim()) return setError('Please add your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('That password is too short. Use at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match. Please check them.');
    setBusy(true);
    try { const result = await signUp(name, email, password); if (result.needsEmailConfirmation) setError('Check your email to finish creating your account, then sign in.'); else router.replace('/(tabs)'); }
    catch (issue) { setError(issue.message); } finally { setBusy(false); }
  };
  return <Screen title="Create account"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}><InputBox value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" /><InputBox value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" /><InputBox value={password} onChangeText={setPassword} placeholder="Password, at least 8 characters" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="new-password" /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} style={{ minHeight: 48, justifyContent: 'center' }}><BodyText>{showPassword ? 'Hide password' : 'Show password'}</BodyText></Pressable><InputBox value={confirm} onChangeText={setConfirm} placeholder="Confirm password" secureTextEntry={!showConfirm} autoCapitalize="none" autoComplete="new-password" /><Pressable accessibilityRole="button" accessibilityLabel={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'} onPress={() => setShowConfirm(!showConfirm)} style={{ minHeight: 48, justifyContent: 'center' }}><BodyText>{showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}</BodyText></Pressable>{error ? <ErrorMessage>{error}</ErrorMessage> : null}<ActionButton label={busy ? 'Creating account...' : 'Create account'} onPress={submit} disabled={busy} /><ActionButton label="Back to welcome" secondary onPress={() => router.replace('/welcome')} /></ScrollView></Screen>;
}
