# HSMOCAP Native Android App

This project is the new Kotlin-native word-learning Android app.

It is separate from the existing Capacitor/WebView project at:

```text
C:\hsmocap\hsmocap-app\android
```

Open this native project in Android Studio:

```text
C:\hsmocap\hsmocap-app\android-native
```

## Current Status

- Package id: `com.hsmocap.app`
- Language: Kotlin
- UI: Native Android views, no WebView wrapper
- Seed words: `app/src/main/assets/seedWords.json`
- Auth boundary: `AuthService`
- Auth implementation: `FirebaseAuthService` when `google-services.json` exists, otherwise `LocalAuthService`
- Study-state boundary: `StudyStore`
- Study implementation: `FirebaseStudyStore` when Firebase is configured, otherwise `LocalStudyStore`

Implemented native screens:

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

## Build

From this folder:

```powershell
.\gradlew.bat assembleDebug
```

Debug APK output:

```text
app\build\outputs\apk\debug\app-debug.apk
```

## Firebase

The native project includes Firebase Auth and Firestore implementations, but it intentionally remains buildable before Firebase Android setup is complete.

Required file:

```text
app\google-services.json
```

Create a Firebase Android app for package `com.hsmocap.app`, download `google-services.json`, and place it there. After that, the app automatically uses:

- `FirebaseAuthService` for email/password and anonymous sign-in
- `GoogleCredentialSignIn` + `FirebaseAuthService` for Google ID token sign-in
- `FirebaseStudyStore` for Firestore study-state restore and best-effort sync

See:

```text
docs\firebase-native-setup.md
docs\final-acceptance-checklist.md
```

That setup guide includes the Firebase Console checklist, SHA fingerprint command, expected Settings-screen status, emulator verification flow, Firestore rules, and troubleshooting notes.
The final acceptance checklist defines the exact gates for calling this native app 100% complete.
