This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint

npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
## Project: dyslexia support app

Three tools in tabs: Read, Write, Summarise. Code in `src/app`, shared code in
`src/components`, `src/services`, `src/context`, `src/constants`.
Must run in Expo Go on iOS. Use only Expo Go-compatible packages
(expo-speech, async-storage, expo-font and similar).
Backend: Python FastAPI in `server/`, separate from the app.

### Working rules
- Keep code simple and commented, readable for a second-year student.
- Touch only the files needed for the task.
- After each completed feature, make a git commit with a clear message. Do not push; I will push.
- Never put API keys in committed code. Keep keys in a git-ignored file.
- If something fails, explain the error in plain words before fixing it.

### Dyslexia-friendly design (apply to every screen)
- Font: Lexend (@expo-google-fonts/lexend), system font as fallback.
- Minimum text size 18, line height about 1.6, extra letter spacing.
- Left-aligned, short lines, no italics, no underlines, no ALL CAPS.
- Background cream (#FBF6E9), text dark grey (#2B2B2B), high contrast.
- Tap targets at least 48 px. Never use colour alone: add an icon or text label.
- One main action per screen, generous spacing, clear friendly messages.
Write app code in plain JavaScript (.js/.jsx), not TypeScript.No type annotations.