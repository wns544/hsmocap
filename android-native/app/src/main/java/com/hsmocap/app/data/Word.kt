package com.hsmocap.app.data

data class Word(
    val index: Int,
    val word: String,
    val meaning: String,
    val exampleSentence: String,
    val exampleTranslation: String,
    val quizKoreanBlank: String,
    val quizAnswers: List<String>,
    val level: String,
    val frequency: Long,
    val frequencyRank: Int,
    val imageUrl: String?,
) {
    fun matches(keyword: String): Boolean {
        val normalized = keyword.trim().lowercase()
        if (normalized.isEmpty()) return true

        return word.lowercase().contains(normalized) ||
            meaning.lowercase().contains(normalized) ||
            exampleSentence.lowercase().contains(normalized) ||
            exampleTranslation.lowercase().contains(normalized)
    }

    fun isInLevel(category: String): Boolean {
        return category == "전체" || level == category
    }

    fun acceptsAnswer(answer: String): Boolean {
        val normalized = answer.trim()
        return normalized.isNotEmpty() &&
            (normalized == quizKoreanBlank || quizAnswers.any { it.trim() == normalized })
    }
}
