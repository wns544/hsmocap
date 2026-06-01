package com.hsmocap.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Dialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.util.Log
import android.view.Gravity
import android.view.ViewGroup
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import com.hsmocap.app.auth.AuthService
import com.hsmocap.app.auth.GoogleCredentialSignIn
import com.hsmocap.app.data.AppDatabase
import com.hsmocap.app.data.CommunityAuthor
import com.hsmocap.app.data.NativeSettings
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.data.WordRepository
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.screens.CommunityScreen
import com.hsmocap.app.screens.CreatePostScreen
import com.hsmocap.app.screens.FlashcardScreen
import com.hsmocap.app.screens.FeedbackScreen
import com.hsmocap.app.screens.HelpScreen
import com.hsmocap.app.screens.HomeScreen
import com.hsmocap.app.screens.LoginScreen
import com.hsmocap.app.screens.MultipleChoiceQuizScreen
import com.hsmocap.app.screens.PostDetailScreen
import com.hsmocap.app.screens.PrivacyScreen
import com.hsmocap.app.screens.QuizResultScreen
import com.hsmocap.app.screens.QuizStartScreen
import com.hsmocap.app.screens.ReviewScreen
import com.hsmocap.app.screens.SentenceQuizScreen
import com.hsmocap.app.screens.ShortAnswerQuizScreen
import com.hsmocap.app.screens.ProfileScreen
import com.hsmocap.app.screens.SettingsScreen
import com.hsmocap.app.screens.WordDetailScreen
import com.hsmocap.app.screens.WordListScreen
import com.hsmocap.app.screens.WordsScreen
import com.hsmocap.app.ui.BottomNav
import com.hsmocap.app.ui.AppDialog
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui
import java.util.Locale

class MainActivity : Activity(), TextToSpeech.OnInitListener {
    private lateinit var ui: Ui
    private lateinit var store: StudyStore
    private lateinit var nativeSettings: NativeSettings
    private lateinit var authService: AuthService
    private lateinit var wordRepository: WordRepository
    private var words: List<Word> = emptyList()
    private var screen: Screen = Screen.Login
    private val backStack = mutableListOf<Screen>()
    private var activeCategory: String = "전체"
    private var searchQuery: String = ""
    private var sentenceQuizIndex: Int = 0
    private var multipleChoiceIndex: Int = 0
    private var multipleChoiceCorrect: Int = 0
    private var shortAnswerIndex: Int = 0
    private var shortAnswerCorrect: Int = 0
    private var flashcardIndex: Int = 0
    private var flashcardShowingAnswer: Boolean = false
    private var flashcardReviewOnly: Boolean = false
    private var selectedPostImageUri: Uri? = null
    private var backCallback: OnBackInvokedCallback? = null
    private var textToSpeech: TextToSpeech? = null
    private var textToSpeechReady: Boolean = false
    private var authLoadingDialog: Dialog? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ui = Ui(this)
        nativeSettings = NativeSettings(this)
        authService = NativeServices.auth(this)
        store = createStudyStore(authService.currentUser?.id ?: "anonymous")
        wordRepository = NativeServices.wordRepository(this)
        words = wordRepository.loadWords()
        textToSpeech = TextToSpeech(this, this)
        registerBackNavigation()
        navigate(if (authService.currentUser == null) Screen.Login else Screen.Home, addToBackStack = false)
        refreshWords()
    }

    @SuppressLint("GestureBackNavigation")
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        handleBackNavigation()
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            backCallback?.let { onBackInvokedDispatcher.unregisterOnBackInvokedCallback(it) }
        }
        backCallback = null
        textToSpeech?.shutdown()
        textToSpeech = null
        super.onDestroy()
    }

    override fun onInit(status: Int) {
        textToSpeechReady = status == TextToSpeech.SUCCESS
        if (textToSpeechReady) {
            textToSpeech?.language = Locale.US
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == PICK_POST_IMAGE_REQUEST && resultCode == RESULT_OK) {
            selectedPostImageUri = data?.data
            if (screen is Screen.CreatePost) {
                navigate(Screen.CreatePost, addToBackStack = false)
            }
        }
    }

    private fun registerBackNavigation() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val callback = OnBackInvokedCallback { handleBackNavigation() }
            backCallback = callback
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                callback,
            )
        }
    }

    private fun handleBackNavigation() {
        val previous = backStack.removeLastOrNull()
        if (previous != null) {
            navigate(previous, addToBackStack = false)
            return
        }

        when (screen) {
            Screen.Login, Screen.Home -> finish()
            is Screen.PostDetail, Screen.CreatePost -> navigate(Screen.Community, addToBackStack = false)
            Screen.Help, Screen.Feedback, Screen.Privacy, Screen.Profile -> navigate(Screen.Settings, addToBackStack = false)
            is Screen.WordDetail -> navigate(Screen.Words, addToBackStack = false)
            Screen.MultipleChoiceQuiz, Screen.ShortAnswerQuiz, Screen.SentenceQuiz, is Screen.QuizResult, Screen.Flashcard -> navigate(Screen.QuizStart, addToBackStack = false)
            else -> navigate(Screen.Home, addToBackStack = false)
        }
    }

    private fun navigate(next: Screen, addToBackStack: Boolean = true) {
        val previous = screen
        if (addToBackStack && shouldPushBackStack(previous, next)) {
            backStack.add(previous)
        }
        if (next is Screen.Login || previous is Screen.Login && next is Screen.Home) {
            backStack.clear()
        }
        if (next is Screen.Flashcard && previous !is Screen.Review) {
            flashcardReviewOnly = false
        }
        screen = next
        val root = ui.vertical().apply {
            setBackgroundColor(Theme.Background)
        }
        val content = ui.vertical()
        root.addView(
            content,
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f,
            ),
        )

        when (next) {
            Screen.Login -> content.addView(
                LoginScreen(
                    activity = this,
                    ui = ui,
                    onLogin = { email, password ->
                        runAuth(
                            action = { authService.signInWithEmail(email, password) },
                            onSuccess = {
                                store = createStudyStore(authService.currentUser?.id ?: "anonymous")
                                navigate(Screen.Home, addToBackStack = false)
                            },
                            fallbackMessage = "로그인에 실패했습니다.",
                            loadingMessage = "로그인 중입니다.",
                        )
                    },
                    onSignup = { email, password ->
                        runAuth(
                            action = { authService.signUpWithEmail(email, password) },
                            onSuccess = {
                                store = createStudyStore(authService.currentUser?.id ?: "anonymous")
                                Toast.makeText(this, "가입되었습니다.", Toast.LENGTH_SHORT).show()
                                navigate(Screen.Home, addToBackStack = false)
                            },
                            fallbackMessage = "회원가입에 실패했습니다.",
                            loadingMessage = "회원가입 중입니다.",
                        )
                    },
                    onGoogleLogin = {
                        Log.d(TAG, "Google login button clicked")
                        showAuthLoading("Google 로그인 중입니다.")
                        GoogleCredentialSignIn.requestIdToken(
                            activity = this,
                            onSuccess = { idToken ->
                                runAuth(
                                    action = { authService.signInWithGoogleIdToken(idToken) },
                                    onSuccess = {
                                        store = createStudyStore(authService.currentUser?.id ?: "anonymous")
                                        navigate(Screen.Home, addToBackStack = false)
                                    },
                                    fallbackMessage = "Google 로그인에 실패했습니다.",
                                    loadingMessage = null,
                                )
                            },
                            onFailure = { message ->
                                Log.e(TAG, "Google credential flow failed: $message")
                                runOnUiThread {
                                    dismissAuthLoading()
                                    Toast.makeText(this, message, Toast.LENGTH_LONG).show()
                                }
                            },
                        )
                    },
                    onGuestLogin = {
                        runAuth(
                            action = { authService.signInAsGuest() },
                            onSuccess = {
                                store = createStudyStore(authService.currentUser?.id ?: "anonymous")
                                navigate(Screen.Home, addToBackStack = false)
                            },
                            fallbackMessage = "게스트 로그인에 실패했습니다.",
                            loadingMessage = "게스트로 시작하는 중입니다.",
                        )
                    },
                ).view(),
            )
            Screen.Home -> content.addView(HomeScreen(
                this,
                ui,
                words,
                store,
                nativeSettings,
                authService.currentUser?.displayName ?: "워디 사용자",
                ::navigate,
            ).view())
            Screen.Words -> content.addView(
                WordsScreen(
                    activity = this,
                    ui = ui,
                    words = words,
                    store = store,
                    activeCategory = activeCategory,
                    searchQuery = searchQuery,
                    onCategorySelected = {
                        activeCategory = it
                        navigate(Screen.Words, addToBackStack = false)
                    },
                    onSearchChanged = {
                        searchQuery = it
                        navigate(Screen.Words, addToBackStack = false)
                    },
                    navigate = ::navigate,
                ).view(),
            )
            is Screen.WordDetail -> content.addView(WordDetailScreen(this, ui, words.getOrNull(next.wordIndex), store, ::speakText, ::navigate).view())
            Screen.QuizStart -> content.addView(
                QuizStartScreen(
                    activity = this,
                    ui = ui,
                    navigate = { destination ->
                        when (destination) {
                            Screen.MultipleChoiceQuiz -> {
                                multipleChoiceIndex = 0
                                multipleChoiceCorrect = 0
                            }
                            Screen.ShortAnswerQuiz -> {
                                shortAnswerIndex = 0
                                shortAnswerCorrect = 0
                            }
                            Screen.SentenceQuiz -> {
                                sentenceQuizIndex = 0
                            }
                            else -> Unit
                        }
                        navigate(destination)
                    },
                ).view(),
            )
            Screen.Favorites -> content.addView(
                WordListScreen(
                    activity = this,
                    ui = ui,
                    title = "즐겨찾기",
                    emptyMessage = "아직 즐겨찾기한 단어가 없습니다.",
                    words = favoriteWords(),
                    store = store,
                    navigate = ::navigate,
                    communityRepository = NativeServices.communityRepository(this),
                    userId = authService.currentUser?.id,
                ).view(),
            )
            Screen.Settings -> content.addView(
                SettingsScreen(
                    activity = this,
                    ui = ui,
                    store = store,
                    settings = nativeSettings,
                    currentUser = authService.currentUser,
                    backendStatus = NativeServices.backendStatus(this),
                    syncMetadata = syncMetadataSummary(),
                    onDataChanged = {
                        navigate(Screen.Settings, addToBackStack = false)
                    },
                    onLogout = {
                        authService.signOut()
                        store = createStudyStore("anonymous")
                        navigate(Screen.Login, addToBackStack = false)
                    },
                    navigate = ::navigate,
                ).view(),
            )
            Screen.Help -> content.addView(HelpScreen(this, ui, ::navigate).view())
            Screen.Feedback -> content.addView(
                FeedbackScreen(
                    activity = this,
                    ui = ui,
                    feedbackRepository = NativeServices.feedbackRepository(this),
                    user = authService.currentUser,
                    navigate = ::navigate,
                ).view(),
            )
            Screen.Privacy -> content.addView(PrivacyScreen(this, ui, ::navigate).view())
            Screen.Profile -> content.addView(ProfileScreen(this, ui, authService.currentUser, words, store, ::showEditProfileDialog, ::navigate).view())
            Screen.Community -> content.addView(
                CommunityScreen(
                    activity = this,
                    ui = ui,
                    words = words,
                    store = store,
                    communityRepository = NativeServices.communityRepository(this),
                    canWrite = canUseServerAccount(),
                    onRequireLogin = ::requireLoginForServerFeature,
                    navigate = ::navigate,
                ).view(),
            )
            Screen.CreatePost -> content.addView(
                CreatePostScreen(
                    activity = this,
                    ui = ui,
                    communityRepository = NativeServices.communityRepository(this),
                    imageUploadRepository = NativeServices.imageUploadRepository(this),
                    author = currentCommunityAuthor(),
                    selectedImageUri = selectedPostImageUri,
                    onPickImage = ::pickPostImage,
                    onClearImage = {
                        selectedPostImageUri = null
                        navigate(Screen.CreatePost, addToBackStack = false)
                    },
                    onPostCreated = {
                        selectedPostImageUri = null
                    },
                    canSubmit = canUseServerAccount(),
                    onRequireLogin = ::requireLoginForServerFeature,
                    navigate = ::navigate,
                ).view(),
            )
            is Screen.PostDetail -> content.addView(
                PostDetailScreen(
                    activity = this,
                    ui = ui,
                    postId = next.postId,
                    communityRepository = NativeServices.communityRepository(this),
                    author = currentCommunityAuthor(),
                    canComment = canUseServerAccount(),
                    onRequireLogin = ::requireLoginForServerFeature,
                    navigate = ::navigate,
                ).view(),
            )
            Screen.Flashcard -> content.addView(
                FlashcardScreen(
                    activity = this,
                    ui = ui,
                    title = if (flashcardReviewOnly) "오답 플래시카드" else "플래시카드",
                    words = if (flashcardReviewOnly) wrongWords() else words,
                    store = store,
                    cardIndex = flashcardIndex,
                    showingAnswer = flashcardShowingAnswer,
                    onFlip = {
                        flashcardShowingAnswer = !flashcardShowingAnswer
                        navigate(Screen.Flashcard, addToBackStack = false)
                    },
                    onNext = {
                        flashcardIndex += 1
                        flashcardShowingAnswer = false
                        navigate(Screen.Flashcard, addToBackStack = false)
                    },
                    navigate = ::navigate,
                ).view(),
            )
            Screen.MultipleChoiceQuiz -> content.addView(
                MultipleChoiceQuizScreen(
                    activity = this,
                    ui = ui,
                    words = words,
                    store = store,
                    quizIndex = multipleChoiceIndex,
                    correctCount = multipleChoiceCorrect,
                    onAnswered = { correct ->
                        if (correct) multipleChoiceCorrect += 1
                        multipleChoiceIndex += 1
                        if (multipleChoiceIndex >= MultipleChoiceQuizScreen.QUIZ_TOTAL) {
                            navigate(Screen.QuizResult("객관식 퀴즈", multipleChoiceCorrect, MultipleChoiceQuizScreen.QUIZ_TOTAL))
                        } else {
                            navigate(Screen.MultipleChoiceQuiz, addToBackStack = false)
                        }
                    },
                    navigate = ::navigate,
                ).view(),
            )
            Screen.ShortAnswerQuiz -> content.addView(
                ShortAnswerQuizScreen(
                    activity = this,
                    ui = ui,
                    words = words,
                    store = store,
                    quizIndex = shortAnswerIndex,
                    correctCount = shortAnswerCorrect,
                    onAnswered = { correct ->
                        if (correct) shortAnswerCorrect += 1
                        shortAnswerIndex += 1
                        if (shortAnswerIndex >= ShortAnswerQuizScreen.QUIZ_TOTAL) {
                            navigate(Screen.QuizResult("단답형 퀴즈", shortAnswerCorrect, ShortAnswerQuizScreen.QUIZ_TOTAL))
                        } else {
                            navigate(Screen.ShortAnswerQuiz, addToBackStack = false)
                        }
                    },
                    navigate = ::navigate,
                ).view(),
            )
            Screen.SentenceQuiz -> content.addView(
                SentenceQuizScreen(
                    activity = this,
                    ui = ui,
                    words = words,
                    store = store,
                    grader = NativeServices.answerGradingRepository(this),
                    imageHints = NativeServices.imageHintRepository(this),
                    quizIndex = sentenceQuizIndex,
                    onSpeak = ::speakText,
                    onNext = {
                        sentenceQuizIndex += 1
                        navigate(Screen.SentenceQuiz, addToBackStack = false)
                    },
                ).view(),
            )
            is Screen.QuizResult -> content.addView(
                QuizResultScreen(
                    activity = this,
                    ui = ui,
                    title = next.title,
                    correct = next.correct,
                    total = next.total,
                    navigate = ::navigate,
                ).view(),
            )
            Screen.Review -> content.addView(
                ReviewScreen(
                    activity = this,
                    ui = ui,
                    words = words,
                    store = store,
                    onStartReviewCards = {
                        flashcardReviewOnly = true
                        flashcardIndex = 0
                        flashcardShowingAnswer = false
                        navigate(Screen.Flashcard)
                    },
                    navigate = ::navigate,
                ).view(),
            )
        }

        if (next.showsBottomNav) {
            root.addView(BottomNav(ui, next, ::navigate).view())
        }

        setContentView(root)
    }

    private fun shouldPushBackStack(previous: Screen, next: Screen): Boolean {
        if (previous == next) return false
        if (previous is Screen.Login || next is Screen.Login) return false
        return true
    }

    private fun favoriteWords(): List<Word> {
        val ids = store.favoriteIds()
        return words.filter { ids.contains(it.index) }
    }

    private fun wrongWords(): List<Word> {
        val ids = store.wrongAnswerIds()
        return words.filter { ids.contains(it.index) }
    }

    private fun createStudyStore(userId: String): StudyStore {
        return NativeServices.studyStore(this, userId) {
            runOnUiThread { navigate(screen, addToBackStack = false) }
        }
    }

    private fun refreshWords() {
        wordRepository.refresh { result ->
            result.onSuccess { refreshedWords ->
                if (refreshedWords.isNotEmpty() && refreshedWords != words) {
                    runOnUiThread {
                        words = refreshedWords
                        navigate(screen, addToBackStack = false)
                    }
                }
            }
        }
    }

    private fun syncMetadataSummary(): String {
        val dao = AppDatabase.get(this).syncMetadataDao()
        val userId = authService.currentUser?.id ?: "anonymous"
        val wordsSync = dao.get("words")?.lastSyncedAt?.toRelativeSyncLabel()
        val studySync = dao.get("study:$userId")?.lastSyncedAt?.toRelativeSyncLabel()
        return listOfNotNull(
            wordsSync?.let { "단어 $it" },
            studySync?.let { "학습 $it" },
        ).ifEmpty {
            listOf("아직 동기화 기록 없음")
        }.joinToString(" · ")
    }

    private fun Long.toRelativeSyncLabel(): String {
        val minutes = ((System.currentTimeMillis() - this).coerceAtLeast(0L) / 60000L).toInt()
        return when {
            minutes < 1 -> "방금"
            minutes < 60 -> "${minutes}분 전"
            minutes < 1440 -> "${minutes / 60}시간 전"
            else -> "${minutes / 1440}일 전"
        }
    }

    private fun currentCommunityAuthor(): CommunityAuthor {
        val user = authService.currentUser
        val displayName = user?.displayName?.ifBlank { null } ?: "워디 사용자"
        return CommunityAuthor(
            id = user?.id ?: "anonymous",
            name = displayName,
            avatar = displayName.firstOrNull()?.uppercaseChar()?.toString() ?: "W",
            level = "레벨 ${store.streakDays().coerceAtLeast(1)}",
        )
    }

    private fun canUseServerAccount(): Boolean {
        return authService.currentUser != null
    }

    private fun requireLoginForServerFeature() {
        AppDialog.confirm(
            activity = this,
            ui = ui,
            title = "로그인이 필요합니다",
            message = "로그인 후 이용할 수 있는 기능입니다.\n로그인 화면으로 이동할까요?",
            negativeLabel = "아니요",
            positiveLabel = "로그인하기",
            onPositive = {
                authService.signOut()
                store = createStudyStore("anonymous")
                navigate(Screen.Login, addToBackStack = false)
            },
        )
    }

    private fun showEditProfileDialog() {
        val current = authService.currentUser
        if (current == null) {
            Toast.makeText(this, "프로필 수정은 로그인 후 사용할 수 있습니다.", Toast.LENGTH_LONG).show()
            return
        }

        AppDialog.textInput(
            activity = this,
            ui = ui,
            title = "프로필 수정",
            message = "앱에서 표시할 닉네임을 입력해 주세요.",
            hint = "닉네임",
            initialValue = current.displayName,
            negativeLabel = "취소",
            positiveLabel = "저장",
        ) { dialog, name ->
            runAuth(
                action = { authService.updateDisplayName(name) },
                onSuccess = {
                    Toast.makeText(this@MainActivity, "프로필이 수정되었습니다.", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                    navigate(Screen.Profile, addToBackStack = false)
                },
                fallbackMessage = "프로필 수정에 실패했습니다.",
            )
        }
    }

    private fun pickPostImage() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        startActivityForResult(Intent.createChooser(intent, "이미지 선택"), PICK_POST_IMAGE_REQUEST)
    }

    private fun speakText(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        if (!textToSpeechReady) {
            Toast.makeText(this, "발음 기능을 준비하는 중입니다.", Toast.LENGTH_SHORT).show()
            return
        }
        textToSpeech?.speak(trimmed, TextToSpeech.QUEUE_FLUSH, null, "wordy-${System.currentTimeMillis()}")
    }

    private fun runAuth(
        action: () -> Unit,
        onSuccess: () -> Unit,
        fallbackMessage: String,
        loadingMessage: String? = null,
    ) {
        loadingMessage?.let { showAuthLoading(it) }
        Thread {
            runCatching { action() }
                .onSuccess {
                    Log.d(TAG, "Auth action succeeded")
                    runOnUiThread {
                        dismissAuthLoading()
                        onSuccess()
                    }
                }
                .onFailure { error ->
                    Log.e(TAG, "Auth action failed: ${error.javaClass.name}: ${error.message}", error)
                    runOnUiThread {
                        dismissAuthLoading()
                        val message = error.message ?: "${fallbackMessage} (${error.javaClass.simpleName})"
                        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
                    }
                }
        }.start()
    }

    private fun showAuthLoading(message: String) {
        if (authLoadingDialog?.isShowing == true) return
        authLoadingDialog = Dialog(this).apply {
            setCancelable(false)
            setContentView(
                ui.horizontal().apply {
                    gravity = Gravity.CENTER_VERTICAL
                    setPadding(ui.dp(24), ui.dp(18), ui.dp(24), ui.dp(18))
                    background = ui.rounded(Theme.Card, 18, Theme.Border)
                    addView(ProgressBar(this@MainActivity).apply {
                        isIndeterminate = true
                    }, LinearLayout.LayoutParams(ui.dp(34), ui.dp(34)).apply {
                        setMargins(0, 0, ui.dp(14), 0)
                    })
                    addView(ui.text(message, 16, Theme.Text, true))
                },
            )
            window?.setBackgroundDrawableResource(android.R.color.transparent)
        }
        authLoadingDialog?.show()
    }

    private fun dismissAuthLoading() {
        authLoadingDialog?.dismiss()
        authLoadingDialog = null
    }

    companion object {
        private const val TAG = "WordyMain"
        private const val PICK_POST_IMAGE_REQUEST = 4301
    }
}
