// One safe entry point for speech synthesis and the shared mobile audio session.
import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';

export const NO_VOICE_MESSAGE = 'This device has no text-to-speech voice. Open the device settings, search for Text-to-speech, and install a voice.';

export function getSpeechVoices() {
  return Speech.getAvailableVoicesAsync();
}

export async function speakText(text, options = {}) {
  if (!String(text || '').trim()) return;
  const rate = Number.isFinite(options.rate) ? Math.max(0.5, Math.min(2, options.rate)) : 1;
  const pitch = Number.isFinite(options.pitch) ? Math.max(0.5, Math.min(2, options.pitch)) : 1;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
    Speech.speak(String(text), {
      language: options.language || 'en-US', rate, pitch, volume: 1,
      onStart: options.onStart,
      onDone: options.onDone,
      onStopped: options.onStopped,
      onBoundary: options.onBoundary,
      onError: (error) => {
        console.error('Speech playback failed:', error);
        options.onError?.(error);
      },
    });
  } catch (error) {
    console.error('Speech setup failed:', error);
    options.onError?.(error);
  }
}

export function stopSpeech() {
  return Speech.stop();
}
