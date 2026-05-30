# HSMOCAP Native Screen Map

Goal: rebuild the deployed HSMOCAP word-learning app as a native Android app without using WebView.

The existing Capacitor/WebView project stays unchanged:

```text
../android
```

The native implementation lives here:

```text
android-native
```

## Technology Choice

Use Kotlin for the native app implementation.

Reasons:

- The app has many UI states and screen transitions.
- Word, quiz, favorite, wrong-answer, and progress data are safer as Kotlin data classes.
- Sealed navigation/screen state reduces stringly typed routing errors.
- Kotlin is the standard fit for modern Android app work.
- Java prototype code can be used as a reference while moving toward a maintainable structure.

## Web To Native Mapping

| Web route | Native screen | Status |
| --- | --- | --- |
| `/login` | `LoginScreen` | First pass exists in Java prototype |
| `/app/home` | `HomeScreen` | First pass exists in Java prototype |
| `/app/words` | `WordsScreen` | First pass exists in Java prototype |
| `/app/words/:id` | `WordDetailScreen` | First pass exists in Java prototype |
| `/app/flashcard-study` | `FlashcardScreen` | First pass exists in Java prototype |
| `/app/sentence-quiz` | `SentenceQuizScreen` | First pass exists in Java prototype |
| `/app/quiz` | `QuizStartScreen` | Pending |
| `/app/quiz/multiple-choice` | `MultipleChoiceQuizScreen` | Pending |
| `/app/quiz/short-answer` | `ShortAnswerQuizScreen` | Pending |
| `/app/quiz/result` | `QuizResultScreen` | Pending |
| `/app/review` | `ReviewScreen` | First pass exists in Java prototype |
| `/app/wrong-answers` | `WrongAnswersScreen` | Pending |
| `/app/favorites` | `FavoritesScreen` | First pass exists in Java prototype |
| `/app/flashcard-favorites` | `FavoriteFlashcardScreen` | Pending |
| `/app/sentence-favorites` | `FavoriteSentenceQuizScreen` | Pending |
| `/app/settings` | `SettingsScreen` | First pass exists in Java prototype |
| `/app/profile` | `ProfileScreen` | First pass exists in Java prototype |
| `/app/community` | `CommunityScreen` | Placeholder exists in Java prototype |
| `/app/community/create` | `CreatePostScreen` | Pending |
| `/app/community/:id` | `PostDetailScreen` | Pending |

## Native Package Layout

```text
app/src/main/java/com/hsmocap/app/
  MainActivity.kt
  data/
    Word.kt
    WordRepository.kt
    StudyStore.kt
  navigation/
    Screen.kt
  ui/
    Theme.kt
    Ui.kt
    BottomNav.kt
  screens/
    LoginScreen.kt
    HomeScreen.kt
    WordsScreen.kt
    WordDetailScreen.kt
    FlashcardScreen.kt
    SentenceQuizScreen.kt
    FavoritesScreen.kt
    ReviewScreen.kt
    SettingsScreen.kt
    ProfileScreen.kt
    CommunityScreen.kt
```

## Data Source

Native app uses the same curated word asset:

```text
app/src/main/assets/seedWords.json
```

Required fields:

- `word`
- `meaning`
- `exampleSentence`
- `exampleTranslation`
- `quizKoreanBlank`
- `quizAnswers`
- `level`
- `frequency`
- `frequencyRank`

## Verification Checklist

- Debug APK builds.
- App opens without WebView.
- Login screen appears.
- Guest login opens Home.
- Bottom tab navigation works.
- Words list loads from `seedWords.json`.
- Search and level filters work.
- Word detail opens.
- Favorites persist after restart.
- Wrong answers persist after restart.
- Flashcard flow completes.
- Sentence quiz grades answers from `quizAnswers`.
