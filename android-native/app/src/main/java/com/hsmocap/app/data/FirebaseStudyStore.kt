package com.hsmocap.app.data

import android.os.Handler
import android.os.Looper
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions

class FirebaseStudyStore(
    private val local: LocalStudyDataStore,
    userId: String,
    private val onRemoteChanged: () -> Unit = {},
) : StudyStore, SyncStatusProvider {
    private val document = FirebaseFirestore.getInstance()
        .collection("users")
        .document(userId)
        .collection("studyState")
        .document("current")
    private val retryHandler = Handler(Looper.getMainLooper())
    private var remoteLoaded: Boolean = false
    private var pendingWrite: Boolean = false
    private var retryScheduled: Boolean = false
    private var retryDelayMs: Long = INITIAL_RETRY_DELAY_MS
    private var lastError: String? = null

    init {
        loadRemote()
    }

    override var notificationsEnabled: Boolean
        get() = local.notificationsEnabled
        set(value) {
            local.notificationsEnabled = value
            sync()
        }

    override fun favoriteIds(): Set<Int> = local.favoriteIds()

    override fun wrongAnswerIds(): Set<Int> = local.wrongAnswerIds()

    override fun isFavorite(word: Word): Boolean = local.isFavorite(word)

    override fun toggleFavorite(word: Word) {
        local.toggleFavorite(word)
        sync()
    }

    override fun addWrongAnswer(word: Word) {
        local.addWrongAnswer(word)
        sync()
    }

    override fun removeWrongAnswer(word: Word) {
        local.removeWrongAnswer(word)
        sync()
    }

    override fun clearWrongAnswers() {
        local.clearWrongAnswers()
        sync()
    }

    override fun clearFavorites() {
        local.clearFavorites()
        sync()
    }

    override fun clearStudyProgress() {
        local.clearStudyProgress()
        sync()
    }

    override fun totalAnswered(): Int = local.totalAnswered()

    override fun correctAnswered(): Int = local.correctAnswered()

    override fun todayAnswered(): Int = local.todayAnswered()

    override fun streakDays(): Int = local.streakDays()

    override fun accuracyPercent(): Int = local.accuracyPercent()

    override fun recordAnswer(correct: Boolean) {
        local.recordAnswer(correct)
        sync()
    }

    override fun recordAnswerOnce(key: String, correct: Boolean): Boolean {
        val recorded = local.recordAnswerOnce(key, correct)
        if (recorded) sync()
        return recorded
    }

    override fun syncStatus(): SyncStatus {
        val pendingLocalActions = local.pendingActionCount()
        val title = when {
            lastError != null -> "동기화 확인 필요"
            pendingWrite -> "원격 저장 중"
            pendingLocalActions > 0 -> "로컬 저장 · 동기화 대기"
            remoteLoaded -> "Firebase 동기화됨"
            else -> "원격 데이터 확인 중"
        }
        val detail = lastError
            ?: if (pendingLocalActions > 0) {
                "학습 변경 ${pendingLocalActions}개가 기기에 저장되어 있고 원격 재동기화를 기다립니다."
            } else if (remoteLoaded) {
                "Firestore 원격 상태를 읽고 로컬 상태와 병합했습니다."
            } else {
                "Firestore에서 학습 상태를 불러오는 중입니다."
            }
        return SyncStatus(title, detail)
    }

    private fun sync() {
        val state = local.snapshot()
        val accuracy = accuracyPercent()
        val profileStats = ProfileStatsCalculator.calculate(
            totalAnswered = state.totalAnswered,
            correctAnswered = state.correctAnswered,
            streakDays = state.streakDays,
            favoriteCount = state.favorites.size,
            accuracyPercent = accuracy,
        )
        pendingWrite = true
        lastError = null
        document.set(
            mapOf(
                "favorites" to state.favorites.sorted(),
                "wrongAnswers" to state.wrongAnswers.sorted(),
                "notificationsEnabled" to state.notificationsEnabled,
                "totalAnswered" to state.totalAnswered,
                "correctAnswered" to state.correctAnswered,
                "todayDate" to state.todayDate,
                "todayAnswered" to state.todayAnswered,
                "lastStudyDate" to state.lastStudyDate,
                "streakDays" to state.streakDays,
                "accuracyPercent" to accuracy,
                "profileXp" to profileStats.xp,
                "profileLevel" to profileStats.level,
                "profileAchievements" to profileStats.achievements,
                "profileAchievementCount" to profileStats.achievements.size,
                "updatedAt" to Timestamp.now(),
            ),
            SetOptions.merge(),
        )
            .addOnSuccessListener {
                pendingWrite = false
                retryScheduled = false
                retryDelayMs = INITIAL_RETRY_DELAY_MS
                lastError = null
                local.markSynced("Firestore studyState 저장 완료")
                onRemoteChanged()
            }
            .addOnFailureListener { error ->
                pendingWrite = false
                lastError = error.localizedMessage ?: "Firestore 저장에 실패했습니다."
                scheduleRetryIfNeeded()
                onRemoteChanged()
            }
    }

    private fun loadRemote() {
        document.get()
            .addOnSuccessListener { snapshot ->
                remoteLoaded = true
                lastError = null
                if (!snapshot.exists()) {
                    sync()
                    onRemoteChanged()
                    return@addOnSuccessListener
                }
                val changed = local.mergeRemoteState(snapshot.toStudyState())
                if (changed || local.pendingActionCount() > 0) {
                    sync()
                }
                onRemoteChanged()
            }
            .addOnFailureListener { error ->
                remoteLoaded = false
                lastError = error.localizedMessage ?: "Firestore 원격 데이터를 불러오지 못했습니다."
                scheduleRetryIfNeeded()
                onRemoteChanged()
            }
    }

    private fun scheduleRetryIfNeeded() {
        if (retryScheduled || pendingWrite || local.pendingActionCount() <= 0) return

        retryScheduled = true
        val delay = retryDelayMs
        retryDelayMs = (retryDelayMs * 2).coerceAtMost(MAX_RETRY_DELAY_MS)
        retryHandler.postDelayed({
            retryScheduled = false
            if (local.pendingActionCount() > 0) {
                sync()
            }
        }, delay)
    }

    private fun DocumentSnapshot.toStudyState(): StudyState {
        return StudyState(
            favorites = numberList("favorites"),
            wrongAnswers = numberList("wrongAnswers"),
            notificationsEnabled = getBoolean("notificationsEnabled") ?: local.notificationsEnabled,
            totalAnswered = getLong("totalAnswered").toIntOrZero(),
            correctAnswered = getLong("correctAnswered").toIntOrZero(),
            todayDate = getString("todayDate"),
            todayAnswered = getLong("todayAnswered").toIntOrZero(),
            lastStudyDate = getString("lastStudyDate"),
            streakDays = getLong("streakDays").toIntOrZero(),
        )
    }

    private fun DocumentSnapshot.numberList(field: String): Set<Int> {
        return (get(field) as? List<*>)
            .orEmpty()
            .mapNotNull { value -> (value as? Number)?.toInt() }
            .toSet()
    }

    private fun Long?.toIntOrZero(): Int {
        return this?.toInt() ?: 0
    }

    companion object {
        private const val INITIAL_RETRY_DELAY_MS = 15_000L
        private const val MAX_RETRY_DELAY_MS = 120_000L
    }
}
