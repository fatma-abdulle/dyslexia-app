// Keeps guest and account sessions available across app restarts.
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { hasSupabaseConfig, supabase } from '../services/supabase';

const AuthContext = createContext(null);
const ACCOUNTS_KEY = 'local-auth-accounts';
const SESSION_KEY = 'local-auth-session';
const cleanEmail = (email) => email.trim().toLowerCase();
const hashPassword = (salt, password) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

function mapSupabaseUser(session) {
  const user = session?.user;
  return user ? { id: user.id, email: user.email, name: user.user_metadata?.name || user.email } : null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ loading: true, mode: 'signedOut', user: null });
  useEffect(() => {
    let unsubscribe = () => {};
    AsyncStorage.getItem(SESSION_KEY).then(async (saved) => {
      const session = saved ? JSON.parse(saved) : null;
      if (session?.mode === 'guest') return setAuth({ loading: false, mode: 'guest', user: null });
      if (hasSupabaseConfig) {
        const { data } = await supabase.auth.getSession();
        setAuth({ loading: false, mode: data.session ? 'account' : 'signedOut', user: mapSupabaseUser(data.session) });
        const listener = supabase.auth.onAuthStateChange((_event, nextSession) => setAuth({ loading: false, mode: nextSession ? 'account' : 'signedOut', user: mapSupabaseUser(nextSession) }));
        unsubscribe = () => listener.data.subscription.unsubscribe();
        return;
      }
      if (session?.email) {
        const accounts = JSON.parse(await AsyncStorage.getItem(ACCOUNTS_KEY) || '{}');
        if (accounts[session.email]) return setAuth({ loading: false, mode: 'account', user: accounts[session.email].profile });
      }
      setAuth({ loading: false, mode: 'signedOut', user: null });
    }).catch(() => setAuth({ loading: false, mode: 'signedOut', user: null }));
    return () => unsubscribe();
  }, []);

  const continueAsGuest = async () => {
    if (hasSupabaseConfig) await supabase.auth.signOut();
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ mode: 'guest' }));
    setAuth({ loading: false, mode: 'guest', user: null });
  };

  const signUp = async (name, email, password) => {
    const address = cleanEmail(email);
    if (hasSupabaseConfig) {
      await AsyncStorage.removeItem(SESSION_KEY);
      const { data, error } = await supabase.auth.signUp({ email: address, password, options: { data: { name: name.trim() } } });
      if (error) throw new Error(error.message.toLowerCase().includes('already') ? 'An account with this email already exists. Try signing in.' : 'We could not create the account. Check your details and try again.');
      if (!data.session) return { needsEmailConfirmation: true };
      return { needsEmailConfirmation: false };
    }
    const accounts = JSON.parse(await AsyncStorage.getItem(ACCOUNTS_KEY) || '{}');
    if (accounts[address]) throw new Error('An account with this email already exists. Try signing in.');
    const salt = Array.from(await Crypto.getRandomBytesAsync(16), (byte) => byte.toString(16).padStart(2, '0')).join('');
    accounts[address] = { salt, passwordHash: await hashPassword(salt, password), profile: { id: Crypto.randomUUID(), email: address, name: name.trim() } };
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ mode: 'account', email: address }));
    setAuth({ loading: false, mode: 'account', user: accounts[address].profile });
    return { needsEmailConfirmation: false };
  };

  const signIn = async (email, password) => {
    const address = cleanEmail(email);
    if (hasSupabaseConfig) {
      await AsyncStorage.removeItem(SESSION_KEY);
      const { error } = await supabase.auth.signInWithPassword({ email: address, password });
      if (error) throw new Error('That email or password is not correct. Try again.');
      return;
    }
    const accounts = JSON.parse(await AsyncStorage.getItem(ACCOUNTS_KEY) || '{}');
    const account = accounts[address];
    if (!account || account.passwordHash !== await hashPassword(account.salt, password)) throw new Error('That email or password is not correct. Try again.');
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ mode: 'account', email: address }));
    setAuth({ loading: false, mode: 'account', user: account.profile });
  };

  const signOut = async () => {
    if (hasSupabaseConfig) await supabase.auth.signOut();
    await AsyncStorage.removeItem(SESSION_KEY);
    setAuth({ loading: false, mode: 'signedOut', user: null });
  };

  return <AuthContext.Provider value={{ ...auth, isAllowed: auth.mode === 'guest' || auth.mode === 'account', continueAsGuest, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
