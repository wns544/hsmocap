package com.hsmocap.app.data

data class ProfileStats(
    val xp: Int,
    val level: Int,
    val nextLevelXp: Int,
    val levelProgressPercent: Int,
    val remainingXp: Int,
    val achievements: List<String>,
)

object ProfileStatsCalculator {
    private const val XP_PER_LEVEL = 300

    fun calculate(
        totalAnswered: Int,
        correctAnswered: Int,
        streakDays: Int,
        favoriteCount: Int,
        accuracyPercent: Int,
    ): ProfileStats {
        val xp = correctAnswered * 15 +
            (totalAnswered - correctAnswered).coerceAtLeast(0) * 5 +
            streakDays * 30 +
            favoriteCount * 3
        val level = (xp / XP_PER_LEVEL + 1).coerceAtLeast(1)
        val nextLevelXp = level * XP_PER_LEVEL
        val currentLevelStart = (level - 1) * XP_PER_LEVEL
        val achievements = achievementStates(
            totalAnswered = totalAnswered,
            correctAnswered = correctAnswered,
            streakDays = streakDays,
            accuracyPercent = accuracyPercent,
        ).filter { it.second }.map { it.first }

        return ProfileStats(
            xp = xp,
            level = level,
            nextLevelXp = nextLevelXp,
            levelProgressPercent = ((xp - currentLevelStart) * 100 / XP_PER_LEVEL).coerceIn(0, 100),
            remainingXp = (nextLevelXp - xp).coerceAtLeast(0),
            achievements = achievements,
        )
    }

    fun achievementStates(
        totalAnswered: Int,
        correctAnswered: Int,
        streakDays: Int,
        accuracyPercent: Int,
    ): List<Pair<String, Boolean>> {
        return listOf(
            "첫 걸음" to (totalAnswered >= 1),
            "연습생" to (totalAnswered >= 10),
            "성실왕" to (streakDays >= 3),
            "퀴즈 마스터" to (correctAnswered >= 30),
            "전문가" to (totalAnswered >= 100),
            "완벽주의자" to (accuracyPercent >= 90 && totalAnswered >= 20),
        )
    }
}
