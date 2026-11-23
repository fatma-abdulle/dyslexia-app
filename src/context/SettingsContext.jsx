// Shared, persistent reading preferences for all tabs.
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaults = { fontSize: 20, lineSpacing: 1.7, letterSpacing: 1, theme: 'cream' };
const SettingsContext = createContext(null);
const palettes = {
  cream: { background: '#FBF6E9', text: '#2B2B2B', card: '#FFFDF8', accent: '#5C6847', soft: '#F1E8D5' },
  blue: { background: '#EAF3FA', text: '#203442', card: '#F8FCFF', accent: '#315E7A', soft: '#D5E7F3' },
  dark: { background: '#20272B', text: '#F5F1E8', card: '#2E383E', accent: '#A9CFB0', soft: '#3D4B50' },
};
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);
  useEffect(() => {
    AsyncStorage.getItem('reading-settings').then((saved) => { if (saved) setSettings({ ...defaults, ...JSON.parse(saved) }); }).catch(() => {});
  }, []);
  const update = (key, value) => setSettings((old) => {
    const next = { ...old, [key]: value };
    AsyncStorage.setItem('reading-settings', JSON.stringify(next)).catch(() => {});
    return next;
  });
  return <SettingsContext.Provider value={{ settings, update, colors: palettes[settings.theme] }}>{children}</SettingsContext.Provider>;
}
export const useSettings = () => useContext(SettingsContext);
