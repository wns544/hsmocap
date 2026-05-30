package com.hsmocap.app.data

import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class FirebaseWordRepository(
    private val dao: WordDao,
    private val syncMetadataDao: SyncMetadataDao,
    private val local: WordRepository,
) : WordRepository {
    private val words = FirebaseFirestore.getInstance().collection("words")

    override fun loadWords(): List<Word> = local.loadWords()

    override fun refresh(callback: (Result<List<Word>>) -> Unit) {
        words.orderBy("createdAt", Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { snapshot ->
                val remoteWords = snapshot.documents
                    .mapIndexedNotNull { index, document -> document.toWord(index) }
                if (remoteWords.isNotEmpty()) {
                    dao.upsertAll(remoteWords.map { WordEntity.from(it) })
                    syncMetadataDao.upsert(
                        SyncMetadataEntity(
                            key = "words",
                            lastSyncedAt = System.currentTimeMillis(),
                            detail = "Firestore words ${remoteWords.size}개 동기화 완료",
                        ),
                    )
                }
                callback(Result.success(loadWords()))
            }
            .addOnFailureListener { error ->
                callback(Result.failure(error))
            }
    }

    private fun DocumentSnapshot.toWord(position: Int): Word? {
        val wordText = getString("word")?.trim().orEmpty()
        if (wordText.isBlank()) return null

        val rank = getLong("frequencyRank")?.toInt()
        val index = rank?.minus(1)?.takeIf { it >= 0 } ?: position
        return Word(
            index = index,
            word = wordText,
            meaning = getString("meaning").orEmpty(),
            exampleSentence = getString("exampleSentence").orEmpty(),
            exampleTranslation = getString("exampleTranslation").orEmpty(),
            quizKoreanBlank = getString("quizKoreanBlank").orEmpty(),
            quizAnswers = stringList("quizAnswers"),
            level = getString("level").orEmpty().ifBlank { "전체" },
            frequency = getLong("frequency") ?: 0L,
            frequencyRank = rank ?: index + 1,
            imageUrl = firstImageUrl(),
        )
    }

    private fun DocumentSnapshot.firstImageUrl(): String? {
        val fields = listOf("imageUrl", "image", "thumbnailUrl", "photoUrl", "downloadUrl")
        return fields.firstNotNullOfOrNull { field ->
            getString(field)?.trim()?.takeIf { it.isNotBlank() }
        }
    }

    private fun DocumentSnapshot.stringList(field: String): List<String> {
        return (get(field) as? List<*>)
            .orEmpty()
            .mapNotNull { value -> (value as? String)?.trim()?.takeIf { it.isNotBlank() } }
    }
}
