package com.hsmocap.app.data

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class RoomStudyStore(
    private val stateDao: StudyStateDao,
    private val pendingActionDao: PendingActionDao,
    private val syncMetadataDao: SyncMetadataDao,
    private val userId: String,
) : LocalStudyDataStore, SyncStatusProvider {
    override var notificationsEnabled: Boolean
        get() = entity().notificationsEnabled
        set(value) {
            update("notifications") { current ->
                current.copy(
                    notificationsEnabled = value,
                    updatedAt = System.currentTimeMillis(),
                )
            }
        }

    override fun favoriteIds(): Set<Int> = entity().favoritesJson.toIntSet()

    override fun wrongAnswerIds(): Set<Int> = entity().wrongAnswersJson.toIntSet()

    override fun isFavorite(word: Word): Boolean = favoriteIds().contains(word.index)

    override fun toggleFavorite(word: Word) {
        update("favorite", word.index.toString()) { current ->
            val next = favoriteIds().toMutableSet()
            if (!next.add(word.index)) {
                next.remove(word.index)
            }
            current.copy(
                favoritesJson = next.toIntJsonArray(),
                updatedAt = System.currentTimeMillis(),
            )
        }
    }

    override fun addWrongAnswer(word: Word) {
        update("wrong_add", word.index.toString()) { current ->
            current.copy(
                wrongAnswersJson = (wrongAnswerIds() + word.index).toIntJsonArray(),
                updatedAt = System.currentTimeMillis(),
            )
        }
    }

    override fun removeWrongAnswer(word: Word) {
        update("wrong_remove", word.index.toString()) { current ->
            current.copy(
                wrongAnswersJson = (wrongAnswerIds() - word.index).toIntJsonArray(),
                updatedAt = System.currentTimeMillis(),
            )
        }
    }

    override fun clearWrongAnswers() {
        update("wrong_clear") { current ->
            current.copy(
                wrongAnswersJson = "[]",
                updatedAt = System.currentTimeMillis(),
            )
        }
    }

    override fun clearFavorites() {
        update("favorite_clear") { current ->
            current.copy(
                favoritesJson = "[]",
                updatedAt = System.currentTimeMillis(),
            )
        }
    }

    override fun clearStudyProgress() {
        update("progress_clear") { current ->
            current.copy(
                totalAnswered = 0,
                correctAnswered = 0,
                todayDate = null,
                todayAnswered = 0,
                lastStudyDate = null,
                streakDays = 0,
                answeredKeysJson = "[]",
                updatedAt = System.currentTimeMillis(),
            )
        }
    }

    override fun totalAnswered(): Int = entity().totalAnswered

    override fun correctAnswered(): Int = entity().correctAnswered

    override fun todayAnswered(): Int {
        val current = entity()
        return if (current.todayDate == todayKey()) current.todayAnswered else 0
    }

    override fun streakDays(): Int {
        val current = entity()
        return when (current.lastStudyDate) {
            todayKey() -> current.streakDays
            yesterdayKey() -> current.streakDays
            else -> 0
        }
    }

    override fun accuracyPercent(): Int {
        val total = totalAnswered()
        if (total == 0) return 0
        return (correctAnswered() * 100 / total).coerceIn(0, 100)
    }

    override fun recordAnswer(correct: Boolean) {
        update("answer") { current ->
            current.nextAnswerState(correct, todayKey(), yesterdayKey())
        }
    }

    override fun recordAnswerOnce(key: String, correct: Boolean): Boolean {
        val trimmedKey = key.trim()
        if (trimmedKey.isEmpty()) return false

        val normalizedKey = "${todayKey()}:$trimmedKey"
        val current = entity()
        val answered = current.answeredKeys()
        if (answered.contains(normalizedKey)) return false

        val next = current
            .nextAnswerState(correct, todayKey(), yesterdayKey())
            .copy(answeredKeysJson = (answered + normalizedKey).toStringJsonArray())
        stateDao.upsert(next)
        markDirty("answer_once", normalizedKey)
        return true
    }

    override fun syncStatus(): SyncStatus {
        val pending = pendingActionCount()
        return SyncStatus(
            title = if (pending > 0) "로컬 저장 · 동기화 대기" else "로컬 저장",
            detail = if (pending > 0) {
                "학습 변경 ${pending}개가 기기에 저장되어 있고 원격 동기화를 기다립니다."
            } else {
                "학습 데이터가 Room 로컬 DB에 저장됩니다."
            },
        )
    }

    override fun snapshot(): StudyState = entity().toStudyState()

    override fun mergeRemoteState(remote: StudyState): Boolean {
        val currentEntity = entity()
        val current = currentEntity.toStudyState()
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

        stateDao.upsert(StudyStateEntity.from(userId, merged, currentEntity.answeredKeys()))
        return true
    }

    override fun pendingActionCount(): Int = pendingActionDao.count(userId)

    override fun markSynced(detail: String) {
        pendingActionDao.clear(userId)
        syncMetadataDao.upsert(
            SyncMetadataEntity(
                key = "study:$userId",
                lastSyncedAt = System.currentTimeMillis(),
                detail = detail.ifBlank { "학습 상태 원격 동기화 완료" },
            ),
        )
    }

    private fun entity(): StudyStateEntity {
        return stateDao.get(userId) ?: StudyStateEntity.empty(userId).also { stateDao.upsert(it) }
    }

    private fun update(type: String, targetId: String = "", transform: (StudyStateEntity) -> StudyStateEntity) {
        stateDao.upsert(transform(entity()))
        markDirty(type, targetId)
    }

    private fun markDirty(type: String, targetId: String = "") {
        pendingActionDao.insert(
            PendingActionEntity(
                userId = userId,
                type = type,
                targetId = targetId,
            ),
        )
    }

    private fun StudyStateEntity.nextAnswerState(
        correct: Boolean,
        today: String,
        yesterday: String,
    ): StudyStateEntity {
        val nextStreak = when (lastStudyDate) {
            today -> streakDays.coerceAtLeast(1)
            yesterday -> streakDays + 1
            else -> 1
        }
        val nextTodayCount = if (todayDate == today) todayAnswered + 1 else 1
        return copy(
            totalAnswered = totalAnswered + 1,
            correctAnswered = correctAnswered + if (correct) 1 else 0,
            todayDate = today,
            todayAnswered = nextTodayCount,
            lastStudyDate = today,
            streakDays = nextStreak,
            updatedAt = System.currentTimeMillis(),
        )
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
    }
}
