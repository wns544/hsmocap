package com.hsmocap.app.data

import android.content.Context
import org.json.JSONArray

interface WordRepository {
    fun loadWords(): List<Word>

    fun refresh(callback: (Result<List<Word>>) -> Unit) {
        callback(Result.success(loadWords()))
    }
}

class SeedWordRepository(private val context: Context) : WordRepository {
    override fun loadWords(): List<Word> {
        val json = context.assets.open(ASSET_NAME).bufferedReader().use { it.readText() }
        val array = JSONArray(json)
        val words = ArrayList<Word>(array.length())

        for (index in 0 until array.length()) {
            val item = array.getJSONObject(index)
            val answersArray = item.optJSONArray("quizAnswers")
            val answers = buildList {
                if (answersArray != null) {
                    for (answerIndex in 0 until answersArray.length()) {
                        val answer = answersArray.optString(answerIndex).trim()
                        if (answer.isNotEmpty()) add(answer)
                    }
                }
            }

            words.add(
                Word(
                    index = index,
                    word = item.optString("word"),
                    meaning = item.optString("meaning"),
                    exampleSentence = item.optString("exampleSentence"),
                    exampleTranslation = item.optString("exampleTranslation"),
                    quizKoreanBlank = item.optString("quizKoreanBlank"),
                    quizAnswers = answers,
                    level = item.optString("level", "전체"),
                    frequency = item.optLong("frequency", 0L),
                    frequencyRank = item.optInt("frequencyRank", index + 1),
                    imageUrl = item.optString("imageUrl").trim().takeIf { it.isNotBlank() },
                )
            )
        }

        return words
    }

    companion object {
        private const val ASSET_NAME = "seedWords.json"
    }
}

class RoomWordRepository(
    private val dao: WordDao,
    private val syncMetadataDao: SyncMetadataDao,
    private val seed: WordRepository,
) : WordRepository {
    override fun loadWords(): List<Word> {
        if (dao.count() == 0) {
            val seedWords = seed.loadWords()
            dao.upsertAll(seedWords.map { WordEntity.from(it) })
            syncMetadataDao.upsert(
                SyncMetadataEntity(
                    key = "words",
                    lastSyncedAt = System.currentTimeMillis(),
                    detail = "seedWords 로컬 적재 완료",
                ),
            )
            return seedWords
        }

        val cachedWords = dao.all().map { it.toWord() }
        return cachedWords.ifEmpty {
            seed.loadWords().also { words ->
                dao.upsertAll(words.map { WordEntity.from(it) })
                syncMetadataDao.upsert(
                    SyncMetadataEntity(
                        key = "words",
                        lastSyncedAt = System.currentTimeMillis(),
                        detail = "seedWords 로컬 복구 완료",
                    ),
                )
            }
        }
    }
}
