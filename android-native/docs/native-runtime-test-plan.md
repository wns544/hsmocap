# Native Runtime Test Plan

Run this only after `adb devices` shows at least one device in `device` state.

If Android Studio shows an emulator but Gradle cannot see it, run:

```powershell
.\gradlew.bat :app:androidDeviceDoctor
```

Expected before runtime testing:

- `adb devices -l` lists an emulator or physical device with `device` state.
- `Available AVDs` includes the Android Studio virtual device you intend to boot.

## 1. Install And Launch

```powershell
.\gradlew.bat :app:connectedDeviceCheck
.\gradlew.bat :app:installFreshDebug
.\gradlew.bat :app:runtimeSmokeCheck
```

Expected:

- The app launches as `com.hsmocap.app`.
- Gradle confirms `com.hsmocap.app` in Android foreground runtime state.
- The first screen is native Login, not a WebView and not blank.
- Settings later reports Firebase config readiness.

## 2. Auth

Verify:

- Guest login reaches Home.
- Email sign-up reaches Home.
- Logout returns to Login.
- Email login with the same account reaches Home.
- Google login reaches Home.

Expected Settings backend status:

```text
Firebase 연결됨
설정 파일 감지됨
Firebase 초기화됨
Web client ID 있음
```

## 3. Local-First Learning

Verify offline-capable learning:

- Word list opens.
- Word detail opens.
- Sentence quiz works.
- Multiple-choice quiz works.
- Short-answer quiz works.
- Flashcard works.
- Wrong-answer review works.
- Favorites work.
- Result screen appears after quiz completion.

Then temporarily disable network and verify learning screens still open from Room data.

## 4. Study Sync

Verify:

- Favorite one word.
- Answer one quiz question incorrectly.
- Confirm Favorites and Review counts update.
- Open Settings and confirm sync status changes from local pending to Firebase sync after network is available.
- Force close and relaunch.
- Log in with the same account.
- Confirm favorite and wrong-answer state restore.
- Confirm profile XP, level, achievements, streak, and stats are derived from restored study state.

## 5. Community Online

Verify with an email or Google account:

- Firestore post list loads.
- Post detail opens.
- Search filters local list results.
- Category chips filter local list results.
- More button loads additional posts.
- Create post succeeds.
- Create post with image uploads to Firebase Storage and displays in list/detail.
- Comment creation succeeds.
- View count records.
- Like toggles.
- Bookmark toggles.

## 6. Community Offline Cache

After loading community list, detail, and comments once:

- Disable network.
- Reopen community list.
- Open a cached post detail.
- Confirm cached comments display.
- Confirm writes remain blocked/fail rather than being queued.

## 7. Advanced Quiz Helpers

Verify:

- Pronunciation button speaks English text.
- AI grading calls Firebase Function for a signed-in Firebase user and falls back locally on failure.
- Image hint button calls Firebase Function and displays an image when available.

## 8. Final UI Approval

After runtime gates pass, ask the user before broad UI matching. Do not start whole-app UI matching without explicit approval.
