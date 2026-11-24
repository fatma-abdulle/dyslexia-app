// Small app-wide toast for plain, short feedback messages.
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Text, View } from 'react-native';

const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  const showToast = useCallback((nextMessage) => {
    setMessage(nextMessage);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), 3500);
  }, []);
  return <ToastContext.Provider value={showToast}><View style={{ flex: 1 }}>{children}{message ? <View accessibilityLiveRegion="polite" pointerEvents="none" style={{ position: 'absolute', bottom: 90, left: 20, right: 20, padding: 14, borderRadius: 12, backgroundColor: '#2B2B2B' }}><Text style={{ color: '#FFFFFF', fontSize: 18, lineHeight: 28 }}>{message}</Text></View> : null}</View></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
