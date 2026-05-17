# Android Packaging Guide

This project now includes a Capacitor-based Android wrapper so the app can be launched from an installed Android app instead of typing the site address manually.

The current Android app opens the hosted site directly:

- `https://hsmocap-d907e.web.app`

## Added files

- `capacitor.config.json`
- `android/`

## Useful commands

```bash
npm run android:sync
npm run android:open
```

`npm run android:sync` syncs the Capacitor config and native Android project.

`npm run android:open` opens the Android project in Android Studio, where you can run it on an emulator/device or build an APK/AAB.

## Recommended build flow

1. Install dependencies with `npm install`.
2. Run `npm run android:sync`.
3. Run `npm run android:open`.
4. In Android Studio, wait for Gradle sync to finish.
5. Use `Run` for a debug install, or `Build > Build Bundle(s) / APK(s)` for a distributable artifact.

## Current runtime model

The Android app currently loads the production Firebase Hosting URL instead of bundling local web assets into the APK.

Benefits:

- the app always shows the latest deployed web version
- web fixes can go live without rebuilding the Android app

Tradeoff:

- the app requires a network connection to load the hosted site

## Local SDK requirement

This repository does not bundle the Android SDK.

If Gradle fails with `SDK location not found`, install Android Studio and the Android SDK first, then either:

- set `ANDROID_HOME` or `ANDROID_SDK_ROOT`
- or create `android/local.properties` with `sdk.dir=YOUR_SDK_PATH`

## Important auth note

Email login and guest login fit this wrapper setup well.

Google login currently uses Firebase Web `signInWithPopup`, which may not behave reliably inside an Android WebView. If Google login is required inside the installed app, the safer next step is one of the following:

- switch the Android app to a native Firebase/Google sign-in flow
- open Google auth in the system browser and return to the app with deep linking

## App identity

- App name: `HSMOCAP`
- Android application id: `com.hsmocap.app`
