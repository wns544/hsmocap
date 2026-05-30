package com.hsmocap.app.data

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class LocalStudyStore(
    context: Context,
    userId: String = "local",
) : LocalStudyDataStore, SyncStatusProvider {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("$PREFS_NAME.${userId.toPrefsKey()}", Context.MODE_PRIVATE)

    override var notificationsEnabled: Boolean
        get() = prefs.getBoolean(KEY_NOTIFICATIONS, true)
        set(value) = prefs.edit().putBoolean(KEY_NOTIFICATIONS, value).apply()

    override fun favoriteIds(): Set<Int> = prefs.getStringSet(KEY_FAVORITES, emptySet())
        .orEmpty()
        .mapNotNull { it.toIntOrNull() }
        .toSet()

    override fun wrongAnswerIds(): Set<Int> = prefs.getStringSet(KEY_WRONG_ANSWERS, emptySet())
        .orEmpty()
        .mapNotNull { it.toIntOrNull() }
        .toSet()

    override fun isFavorite(word: Word): Boolean = favoriteIds().contains(word.index)

    override fun toggleFavorite(word: Word) {
        val next = favoriteIds().toMutableSet()
        if (!next.add(word.index)) {
            next.remove(word.index)
        }
        putIntSet(KEY_FAVORITES, next)
    }

    override fun addWrongAnswer(word: Word) {
        val next = wrongAnswerIds().toMutableSet()
        next.add(word.index)
        putIntSet(KEY_WRONG_ANSWERS, next)
    }

    override fun removeWrongAnswer(word: Word) {
        val next = wrongAnswerIds().toMutableSet()
        next.remove(word.index)
        putIntSet(KEY_WRONG_ANSWERS, next)
    }

    override fun clearWrongAnswers() {
        prefs.edit().remove(KEY_WRONG_ANSWERS).apply()
    }

    override fun clearFavorites() {
        prefs.edit().remove(KEY_FAVORITES).apply()
    }

    override fun clearStudyProgress() {
        prefs.edit()
            .remove(KEY_TOTAL_ANSWERED)
            .remove(KEY_CORRECT_ANSWERED)
            .remove(KEY_TODAY_DATE)
            .remove(KEY_TODAY_ANSWERED)
            .remove(KEY_LAST_STUDY_DATE)
            .remove(KEY_STREAK_DAYS)
            .remove(KEY_ANSWERED_KEYS)
            .apply()
    }

    override fun totalAnswered(): Int = prefs.getInt(KEY_TOTAL_ANSWERED, 0)

    override fun correctAnswered(): Int = prefs.getInt(KEY_CORRECT_ANSWERED, 0)

    override fun todayAnswered(): Int {
        return if (prefs.getString(KEY_TODAY_DATE, null) == todayKey()) {
            prefs.getInt(KEY_TODAY_ANSWERED, 0)
        } else {
            0
        }
    }

    override fun streakDays(): Int {
        val lastDate = prefs.getString(KEY_LAST_STUDY_DATE, null) ?: return 0
        return when (lastDate) {
            todayKey() -> prefs.getInt(KEY_STREAK_DAYS, 0)
            yesterdayKey() -> prefs.getInt(KEY_STREAK_DAYS, 0)
            else -> 0
        }
    }

    override fun accuracyPercent(): Int {
        val total = totalAnswered()
        if (total == 0) return 0
        return (correctAnswered() * 100 / total).coerceIn(0, 100)
    }

    override fun recordAnswer(correct: Boolean) {
        val today = todayKey()
        val lastStudyDate = prefs.getString(KEY_LAST_STUDY_DATE, null)
        val currentStreak = prefs.getInt(KEY_STREAK_DAYS, 0)
        val nextStreak = when (lastStudyDate) {
            today -> currentStreak.coerceAtLeast(1)
            yesterdayKey() -> currentStreak + 1
            else -> 1
        }
        val todayCount = if (prefs.getString(KEY_TODAY_DATE, null) == today) {
            prefs.getInt(KEY_TODAY_ANSWERED, 0)
        } else {
            0
        }

        prefs.edit()
            .putInt(KEY_TOTAL_ANSWERED, totalAnswered() + 1)
            .putInt(KEY_CORRECT_ANSWERED, correctAnswered() + if (correct) 1 else 0)
            .putString(KEY_TODAY_DATE, today)
            .putInt(KEY_TODAY_ANSWERED, todayCount + 1)
            .putString(KEY_LAST_STUDY_DATE, today)
            .putInt(KEY_STREAK_DAYS, nextStreak)
            .apply()
    }

    override fun recordAnswerOnce(key: String, correct: Boolean): Boolean {
        val trimmedKey = key.trim()
        if (trimmedKey.isEmpty()) return false

        val normalizedKey = "${todayKey()}:$trimmedKey"

        val answered = prefs.getStringSet(KEY_ANSWERED_KEYS, emptySet()).orEmpty()
        if (answered.contains(normalizedKey)) return false

        recordAnswer(correct)
        prefs.edit()
            .putStringSet(KEY_ANSWERED_KEYS, answered.toMutableSet().apply { add(normalizedKey) })
            .apply()
        return true
    }

    override fun syncStatus(): SyncStatus {
        return SyncStatus(
            title = "로컬 저장",
            detail = "학습 데이터가 이 기기에만 저장됩니다.",
        )
    }

    override fun snapshot(): StudyState {
        return StudyState(
            favorites = favoriteIds(),
            wrongAnswers = wrongAnswerIds(),
            notificationsEnabled = notificationsEnabled,
            totalAnswered = totalAnswered(),
            correctAnswered = correctAnswered(),
            todayDate = prefs.getString(KEY_TODAY_DATE, null),
            todayAnswered = prefs.getInt(KEY_TODAY_ANSWERED, 0),
            lastStudyDate = prefs.getString(KEY_LAST_STUDY_DATE, null),
            streakDays = prefs.getInt(KEY_STREAK_DAYS, 0),
        )
    }

    override fun mergeRemoteState(remote: StudyState): Boolean {
        val current = snapshot()
        val mergedTodayAnswered = if (remote.todayDate == todayKey()) {
            maxOf(current.todayAnswered, remote.todayAnswered)
        } else {
            current.todayAnswered
        }
        val mergedTodayDate = when {
            current.todayDate == todayKey() -> current.todayDate
            remote.todayDate == todayKey() -> remote.todayDate
            else -> current.todayDate
        }
        val mergedLastStudyDate = listOfNotNull(current.lastStudyDate, remote.lastStudyDate).maxOrNull()
        val merged = StudyState(
            favorites = current.favorites + remote.favorites,
            wrongAnswers = current.wrongAnswers + remote.wrongAnswers,
            notificationsEnabled = remote.notificationsEnabled,
            totalAnswered = maxOf(current.totalAnswered, remote.totalAnswered),
            correctAnswered = maxOf(current.correctAnswered, remote.correctAnswered),
            todayDate = mergedTodayDate,
            todayAnswered = mergedTodayAnswered,
            lastStudyDate = mergedLastStudyDate,
            streakDays = maxOf(current.streakDays, remote.streakDays),
        )

        if (merged == current) return false

        prefs.edit()
            .putStringSet(KEY_FAVORITES, merged.favorites.map { it.toString() }.toSet())
            .putStringSet(KEY_WRONG_ANSWERS, merged.wrongAnswers.map { it.toString() }.toSet())
            .putBoolean(KEY_NOTIFICATIONS, merged.notificationsEnabled)
            .putInt(KEY_TOTAL_ANSWERED, merged.totalAnswered)
            .putInt(KEY_CORRECT_ANSWERED, merged.correctAnswered)
            .putInt(KEY_TODAY_ANSWERED, merged.todayAnswered)
            .putInt(KEY_STREAK_DAYS, merged.streakDays)
            .apply()

        prefs.edit().apply {
            if (merged.todayDate == null) remove(KEY_TODAY_DATE) else putString(KEY_TODAY_DATE, merged.todayDate)
            if (merged.lastStudyDate == null) remove(KEY_LAST_STUDY_DATE) else putString(KEY_LAST_STUDY_DATE, merged.lastStudyDate)
        }.apply()
        return true
    }

    override fun pendingActionCount(): Int = 0

    override fun markSynced(detail: String) = Unit

    private fun putIntSet(key: String, values: Set<Int>) {
        prefs.edit().putStringSet(key, values.map { it.toString() }.toSet()).apply()
    }

    private fun todayKey(): String = DATE_FORMAT.format(Date())

    private fun yesterdayKey(): String {
        return DATE_FORMAT.format(
            Calendar.getInstance().apply {
                add(Calendar.DATE, -1)
            }.time,
        )
    }

    companion object {
        private val DATE_FORMAT = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        private const val PREFS_NAME = "hsmocap_native_study"
        private const val KEY_FAVORITES = "favorites"
        private const val KEY_WRONG_ANSWERS = "wrong"
        private const val KEY_NOTIFICATIONS = "notifications"
        private const val KEY_TOTAL_ANSWERED = "total_answered"
        private const val KEY_CORRECT_ANSWERED = "correct_answered"
        private const val KEY_TODAY_DATE = "today_date"
        private const val KEY_TODAY_ANSWERED = "today_answered"
        private const val KEY_LAST_STUDY_DATE = "last_study_date"
        private const val KEY_STREAK_DAYS = "streak_days"
        private const val KEY_ANSWERED_KEYS = "answered_keys"
    }
}

private fun String.toPrefsKey(): String {
    return map { char ->
        if (char.isLetterOrDigit() || char == '-' || char == '_') char else '_'
    }.joinToString("")
}
