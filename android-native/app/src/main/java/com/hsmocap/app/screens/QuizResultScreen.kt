package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class QuizResultScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val title: String,
    private val correct: Int,
    private val total: Int,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        val safeTotal = total.coerceAtLeast(1)
        val percent = correct * 100 / safeTotal
        return scrollWithContent { box ->
            box.setPadding(ui.dp(24), ui.dp(72), ui.dp(24), ui.dp(24))
            box.gravity = Gravity.CENTER_HORIZONTAL
            box.addView(ui.text("완료", 18, Theme.Primary, true).apply { gravity = Gravity.CENTER })
            box.addView(ui.text(title, 30, Theme.Text, true).apply {
                gravity = Gravity.CENTER
                setPadding(0, ui.dp(8), 0, ui.dp(18))
            })
            box.addView(ui.card().apply {
                gravity = Gravity.CENTER
                setPadding(ui.dp(20), ui.dp(28), ui.dp(20), ui.dp(28))
                addView(ui.text("$correct / $safeTotal", 42, Theme.Text, true).apply { gravity = Gravity.CENTER })
                addView(ui.text("정답률 $percent%", 18, Theme.Primary, true).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(8), 0, 0)
                })
            })
            box.addView(ui.button("다른 퀴즈 풀기", Theme.Primary, Theme.Card).apply {
                setOnClickListener { navigate(Screen.QuizStart) }
            })
            box.addView(ui.button("오답 복습하기", Theme.Card, Theme.Orange).apply {
                setOnClickListener { navigate(Screen.Review) }
            })
            box.addView(ui.button("홈으로", Theme.Card, Theme.Text).apply {
                setOnClickListener { navigate(Screen.Home) }
            })
        }
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }
}
