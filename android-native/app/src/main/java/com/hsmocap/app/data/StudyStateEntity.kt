package com.hsmocap.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import org.json.JSONArray

@Entity(tableName = "study_states")
data class StudyStateEntity(
    @PrimaryKey val userId: String,
    val favoritesJson: String,
    val wrongAnswersJson: String,
    val answeredKeysJson: String,
    val notificationsEnabled: Boolean,
    val totalAnswered: Int,
    val correctAnswered: Int,
    val todayDate: String?,
    val todayAnswered: Int,
    val lastStudyDate: String?,
    val streakDays: Int,
    val updatedAt: Long,
) {
    fun toStudyState(): StudyState {
        return StudyState(
            favorites = favoritesJson.toIntSet(),
            wrongAnswers = wrongAnswersJson.toIntSet(),
            notificationsEnabled = notificationsEnabled,
            totalAnswered = totalAnswered,
            correctAnswered = correctAnswered,
            todayDate = todayDate,
            todayAnswered = todayAnswered,
            lastStudyDate = lastStudyDate,
            streakDays = streakDays,
        )
    }

    fun answeredKeys(): Set<String> = answeredKeysJson.toStringSet()

    companion object {
        fun empty(userId: String): StudyStateEntity {
            return StudyStateEntity(
                userId = userId,
                favoritesJson = "[]",
                wrongAnswersJson = "[]",
                answeredKeysJson = "[]",
                notificationsEnabled = true,
                totalAnswered = 0,
                correctAnswered = 0,
                todayDate = null,
                todayAnswered = 0,
                lastStudyDate = null,
                streakDays = 0,
                updatedAt = System.currentTimeMillis(),
            )
        }

        fun from(userId: String, state: StudyState, answeredKeys: Set<String> = emptySet()): StudyStateEntity {
            return StudyStateEntity(
                userId = userId,
                favoritesJson = state.favorites.toIntJsonArray(),
                wrongAnswersJson = state.wrongAnswers.toIntJsonArray(),
                answeredKeysJson = answeredKeys.toStringJsonArray(),
                notificationsEnabled = state.notificationsEnabled,
                totalAnswered = state.totalAnswered,
                correctAnswered = state.correctAnswered,
                todayDate = state.todayDate,
                todayAnswered = state.todayAnswered,
                lastStudyDate = state.lastStudyDate,
                streakDays = state.streakDays,
                updatedAt = System.currentTimeMillis(),
            )
        }
    }
}

internal fun Set<Int>.toIntJsonArray(): String = JSONArray(toList().sorted()).toString()

internal fun Set<String>.toStringJsonArray(): String = JSONArray(toList().sorted()).toString()

internal fun String.toIntSet(): Set<Int> {
    return runCatching {
        val array = JSONArray(this)
        buildSet {
            for (index in 0 until array.length()) {
                val value = array.optInt(index, Int.MIN_VALUE)
                if (value != Int.MIN_VALUE) add(value)
            }
        }
    }.getOrDefault(emptySet())
}

internal fun String.toStringSet(): Set<String> {
    return runCatching {
        val array = JSONArray(this)
        buildSet {
            for (index in 0 until array.length()) {
                val value = array.optString(index).trim()
                if (value.isNotEmpty()) add(value)
            }
        }
    }.getOrDefault(emptySet())
}
