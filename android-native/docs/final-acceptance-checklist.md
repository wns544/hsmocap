# Native Android Final Acceptance Checklist

Use this checklist to decide when the Kotlin-native word-learning app is complete.

## Pre-Firebase State

These checks must pass before adding Firebase config:

```powershell
.\gradlew.bat :app:nativeStaticAcceptance
```

Expected current `:app:firebaseReadiness` result before `google-services.json` exists:

```text
Status: WAITING
Next: add android-native/app/google-services.json from Firebase Console.
```

The app must remain buildable and usable in local mode.

## Firebase Config Gate

Place the Firebase Android config at:

```text
android-native\app\google-services.json
```

Then run:

```powershell
.\gradlew.bat :app:firebaseReadiness
```

Required result:

```text
Android client: OK
Web client ID: OK
Status: READY
```

If `Web client ID` is missing, enable Google sign-in, register SHA-1/SHA-256, then download `google-services.json` again.

## Emulator Gate

Detailed runtime steps live in `docs/native-runtime-test-plan.md`.

Start an emulator, then run:

```powershell
.\gradlew.bat :app:androidDeviceDoctor
.\gradlew.bat :app:connectedDeviceCheck
.\gradlew.bat :app:installFreshDebug
.\gradlew.bat :app:runtimeSmokeCheck
```

The app must open on the native Login screen, not a WebView and not a blank screen. `runtimeSmokeCheck` must confirm `com.hsmocap.app` appears in Android foreground runtime state.
If `connectedDeviceCheck` fails, use `androidDeviceDoctor` output to confirm the SDK path, ADB path, connected device list, and available AVDs first; `installFreshDebug` and `runtimeSmokeCheck` intentionally depend on that gate.

## Auth Gate

Verify all login flows:

1. Guest login reaches Home.
2. Email sign-up reaches Home.
3. Logout returns to Login.
4. Email login with the same account reaches Home.
5. Google login reaches Home.

Settings must show:

```text
Firebase 연결됨
설정 파일 감지됨
Firebase 초기화됨
Web client ID 있음
```

## Firestore Study-State Gate

Verify study data is restored from Firestore:

1. Favorite one word.
2. Answer one quiz question incorrectly.
3. Confirm Favorites and Review counts update.
4. Force close and relaunch the app.
5. Log in with the same account.
6. Confirm the favorite word and wrong-answer item are still present.
7. Open Settings and confirm sync status shows Firebase sync instead of local-only storage.

## Native UI Gate

Verify these native screens open without crashing:

- Login
- Home
- Word list
- Word detail
- Sentence quiz
- Flashcard
- Wrong-answer review
- Favorites
- Community
- Settings

## Completion Rule

The project is 100% complete only when:

1. `:app:firebaseReadiness` reports `Status: READY`.
2. `lintDebug` succeeds.
3. `assembleDebug` succeeds.
4. The emulator auth gate passes.
5. The Firestore study-state gate passes.
6. Community Firestore reads, writes, comments, views, likes, bookmarks, search/filter, image upload, and cached read-only fallback pass emulator testing.
7. Sentence quiz pronunciation, AI grading, and image hints pass emulator testing.
8. Profile level, XP, streak, achievements, and stats are derived from stored study state.
9. The data boundary in `docs/native-data-architecture.md` remains true in code.
10. The existing Capacitor/WebView Android project remains separate and untouched.
11. Final UI matching to the web app is explicitly approved by the user and completed.

## Current Verification Log

Last checked: 2026-05-23

- `:app:assembleDebug`: passed after Room sync metadata and Function image hint changes.
- `:app:nativeStaticAcceptance`: passed.
- `:app:firebaseReadiness`: passed with `Status: READY`, Android client OK, and Web client ID OK.
- `lintDebug`: passed and wrote `app/build/reports/lint-results-debug.html`.
- `:app:runtimeSmokeCheck`: executed and correctly stopped at `:app:connectedDeviceCheck` because ADB currently has no connected emulator/device.
- `:app:androidDeviceDoctor`: passed. SDK and ADB were found, AVD `Pixel_8` exists, but `adb devices -l` still listed no connected emulator/device.
- `:app:connectedDeviceCheck`: fixed device-line parsing after ADB reported `emulator-5554 device` but the Gradle regex did not match it.
- `:app:runtimeSmokeCheck`: passed on `emulator-5554`; debug APK installed, app data cleared, `com.hsmocap.app/.MainActivity` launched, and Android foreground runtime state confirmed the native app.
- Runtime guest smoke: guest login reached Home. Home, Learning, Community list, and Settings opened from the bottom tabs. Learning showed Room-backed word data (`300개의 단어`, e.g. `arrive`, `ask`, `bake`). Community list showed Firestore-backed posts including image preview. Settings showed `Firebase 동기화` and recent word/study sync status.
- Runtime quiz smoke: Home `문장 퀴즈` opened the quiz start screen with 문장/객관식/단답형 quiz options.
- Runtime email sign-up smoke: email sign-up succeeded with a temporary Firebase account (`odex202605230910@example.com`) and reached Home. The Google Password Manager save prompt appeared after successful account creation and was dismissed.
- Runtime community write smoke: with the signed-in email account, `글쓰기` opened, a Firestore post titled `Codex_runtime_smoke` was created, and the app navigated to the post detail screen.
- Runtime community interaction smoke: on the created post, like, bookmark, and comment writes succeeded. Detail showed `조회 1   좋아요 1   댓글 1   저장 1` and the comment `Codex_runtime_comment`.
- Runtime email re-login smoke: attempted after clearing app data, but ADB text entry repeatedly focused the password field instead of the email field. This remains a manual verification item, not a confirmed app failure.
- Firestore and Storage rules: deployed to `hsmocap-d907e` with `firebase deploy --only firestore:rules,storage`.
- Firebase config is present in the project and Gradle processes `google-services.json`.
- Room local DB now includes words, study state, pending actions, community post cache, and sync metadata.
- Firebase words sync, study-state sync, community repository, image upload repository, answer grading repository, and image hint repository exist in code.
- Windows `adb devices -l` now detects `emulator-5554` in `device` state after launching `Pixel_8` cold boot and waiting for ADB attachment.
- Earlier AVD attempts failed to attach to ADB, but the latest cold boot opened ports 5554/5555, attached as `emulator-5554`, and boot completed.

Remaining release check:

- Verify email login manually, Google login, Firestore study restore across restart, community image upload, Functions-backed AI grading/image hints, offline-cache behavior, and final UI acceptance gates.
- Ask the user before starting broad final UI matching.
