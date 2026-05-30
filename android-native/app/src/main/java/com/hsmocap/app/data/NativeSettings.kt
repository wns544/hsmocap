package com.hsmocap.app.data

import android.content.Context

class NativeSettings(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var dailyGoal: Int
        get() = prefs.getInt(KEY_DAILY_GOAL, 20).coerceIn(5, 100)
        set(value) = prefs.edit().putInt(KEY_DAILY_GOAL, value.coerceIn(5, 100)).apply()

    var reviewCycle: String
        get() = prefs.getString(KEY_REVIEW_CYCLE, "매일") ?: "매일"
        set(value) = prefs.edit().putString(KEY_REVIEW_CYCLE, value.ifBlank { "매일" }).apply()

    companion object {
        private const val PREFS_NAME = "wordy.native.settings"
        private const val KEY_DAILY_GOAL = "daily_goal"
        private const val KEY_REVIEW_CYCLE = "review_cycle"
    }
}
