package com.hsmocap.app.data

interface StudyStore {
    var notificationsEnabled: Boolean

    fun favoriteIds(): Set<Int>
    fun wrongAnswerIds(): Set<Int>
    fun isFavorite(word: Word): Boolean
    fun toggleFavorite(word: Word)
    fun addWrongAnswer(word: Word)
    fun removeWrongAnswer(word: Word)
    fun clearWrongAnswers()
    fun clearFavorites()
    fun clearStudyProgress()
    fun totalAnswered(): Int
    fun correctAnswered(): Int
    fun todayAnswered(): Int
    fun streakDays(): Int
    fun accuracyPercent(): Int
    fun recordAnswer(correct: Boolean)
    fun recordAnswerOnce(key: String, correct: Boolean): Boolean
}

interface SyncStatusProvider {
    fun syncStatus(): SyncStatus
}

interface LocalStudyDataStore : StudyStore {
    fun snapshot(): StudyState
    fun mergeRemoteState(remote: StudyState): Boolean
    fun pendingActionCount(): Int
    fun markSynced(detail: String = "")
}

data class SyncStatus(
    val title: String,
    val detail: String,
)

data class StudyState(
    val favorites: Set<Int>,
    val wrongAnswers: Set<Int>,
    val notificationsEnabled: Boolean,
    val totalAnswered: Int,
    val correctAnswered: Int,
    val todayDate: String?,
    val todayAnswered: Int,
    val lastStudyDate: String?,
    val streakDays: Int,
)
