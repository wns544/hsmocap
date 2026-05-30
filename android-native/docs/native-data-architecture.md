# Native Data Architecture

This native app keeps screen code behind repository boundaries:

```text
Android View Screen
-> MainActivity screen state
-> Repository / Store interface
-> Room local database
-> Firebase Auth, Firestore, Storage, Functions
```

Screens should not call Firebase directly. Firebase-specific code belongs under `data`, `auth`, or `firebase`, and `NativeServices` selects the implementation.
The Gradle `architectureCheck` task enforces this boundary for `MainActivity`, `screens`, `ui`, and `navigation`.

## Local-First Data

These must work without a network after the first local seed load:

- Words, meanings, examples, level, frequency, and optional image URL
- Favorites
- Wrong answers
- Answered question keys
- Total/correct/today answered counts
- Streak days
- Notification setting
- Last sync metadata
- Pending study-state actions

Room tables:

- `words`
- `study_states`
- `pending_actions`
- `community_posts`
- `community_comments_cache`
- `sync_metadata`

The seed asset is only a bootstrap source. `RoomWordRepository` is the local source of truth after the first load.

## Firebase-Synced Data

When Firebase is available, repositories sync these remote sources:

- `words` collection -> local `words`
- `users/{uid}/studyState/current` <-> local `study_states`
- Profile XP, level, and achievements are derived from study state and written into `studyState/current`
- `posts` collection and post subcollections -> community screens
- Firebase Storage `community_posts/{uid}/...` -> community images
- HTTPS Functions -> AI answer grading and image hints

Successful word and study syncs update `sync_metadata`, which is surfaced in Settings.

## Login Boundary

Allowed before server account login:

- Word list
- Word detail
- Sentence quiz
- Multiple-choice quiz
- Short-answer quiz
- Flashcards
- Wrong-answer review
- Local favorites
- Settings/local backend status

Requires email or Google account:

- Multi-device study sync
- Community post creation
- Comment creation
- Likes
- Bookmarks
- Community image upload
- Server-backed profile persistence

Anonymous Firebase users are treated as guest users for UX gates. They may use local-first learning, but server write features should prompt for email or Google login.
Firestore and Storage rules should mirror this boundary: community post creation, comments, likes, bookmarks, and image uploads require a registered Firebase user, not an anonymous user.
Rules also require community `authorId` and user-scoped like/bookmark/view document IDs to match `request.auth.uid`.

## Offline Policy

Learning is local-first:

- Reads use Room data.
- Mutations update Room immediately.
- If Firebase sync fails, local state remains usable and pending actions stay in Room.
- When pending actions remain, `FirebaseStudyStore` retries remote sync with a small backoff.
- Later successful sync clears pending actions and updates `sync_metadata`.

Community is online-first:

- Post list/detail reads use Firestore when possible.
- Recent post list/detail/comment responses are cached in Room.
- Offline community mode is read-only and limited to cached posts and cached comments.
- Comments, likes, bookmarks, views, writing, and image uploads are not queued offline.

Advanced quiz helpers are server-only:

- AI grading uses Firebase Functions when a Firebase user is available.
- Image hints use Firebase Functions when Firebase config is available.
- Local fallback still grades exact answers without AI.

## Completion Requirements

The architecture is complete only when:

- Screens use repository/store interfaces rather than direct Firebase calls.
- Room holds all local-first learning state listed above.
- Firebase words sync can refresh Room and preserve offline learning.
- Study changes work offline first and sync when remote writes succeed.
- Login gates match the boundary above.
- Community writes are blocked without a server account.
- Community offline mode is read-only cache.
- Emulator testing proves Auth, Firestore, Storage, and Functions behavior.
