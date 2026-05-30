package com.hsmocap.app.navigation

sealed class Screen {
    data object Login : Screen()
    data object Home : Screen()
    data object Words : Screen()
    data class WordDetail(val wordIndex: Int) : Screen()
    data object QuizStart : Screen()
    data object MultipleChoiceQuiz : Screen()
    data object ShortAnswerQuiz : Screen()
    data class QuizResult(val title: String, val correct: Int, val total: Int) : Screen()
    data object Flashcard : Screen()
    data object SentenceQuiz : Screen()
    data object Review : Screen()
    data object Favorites : Screen()
    data object Settings : Screen()
    data object Help : Screen()
    data object Feedback : Screen()
    data object Privacy : Screen()
    data object Profile : Screen()
    data object Community : Screen()
    data object CreatePost : Screen()
    data class PostDetail(val postId: String) : Screen()

    val showsBottomNav: Boolean
        get() = this is Home ||
            this is Words ||
            this is Favorites ||
            this is Settings ||
            this is Community
}
