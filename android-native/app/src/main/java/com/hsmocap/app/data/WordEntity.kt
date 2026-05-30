package com.hsmocap.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import org.json.JSONArray

@Entity(tableName = "words")
data class WordEntity(
    @PrimaryKey val id: Int,
    val word: String,
    val meaning: String,
    val exampleSentence: String,
    val exampleTranslation: String,
    val quizKoreanBlank: String,
    val quizAnswersJson: String,
    val level: String,
    val frequency: Long,
    val frequencyRank: Int,
    val imageUrl: String?,
    val updatedAt: Long,
) {
    fun toWord(): Word {
        return Word(
            index = id,
            word = word,
            meaning = meaning,
            exampleSentence = exampleSentence,
            exampleTranslation = exampleTranslation,
            quizKoreanBlank = quizKoreanBlank,
            quizAnswers = quizAnswersJson.toStringList(),
            level = level,
            frequency = frequency,
            frequencyRank = frequencyRank,
            imageUrl = imageUrl,
        )
    }

    companion object {
        fun from(word: Word, updatedAt: Long = System.currentTimeMillis()): WordEntity {
            return WordEntity(
                id = word.index,
                word = word.word,
                meaning = word.meaning,
                exampleSentence = word.exampleSentence,
                exampleTranslation = word.exampleTranslation,
                quizKoreanBlank = word.quizKoreanBlank,
                quizAnswersJson = JSONArray(word.quizAnswers).toString(),
                level = word.level,
                frequency = word.frequency,
                frequencyRank = word.frequencyRank,
                imageUrl = word.imageUrl,
                updatedAt = updatedAt,
            )
        }
    }
}

private fun String.toStringList(): List<String> {
    return runCatching {
        val array = JSONArray(this)
        buildList {
            for (index in 0 until array.length()) {
                val value = array.optString(index).trim()
                if (value.isNotEmpty()) add(value)
            }
        }
    }.getOrDefault(emptyList())
}
