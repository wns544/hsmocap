package com.hsmocap.app.screens

import android.app.Activity
import android.content.res.ColorStateList
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import com.hsmocap.app.R
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class QuizStartScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return scrollWithContent { box ->
            box.setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
            box.addView(ui.text("퀴즈 시작", 30, Theme.Text, true))
            box.addView(ui.text("오늘 공부한 단어를 다시 확인해보세요.", 16, Theme.Muted).apply {
                setPadding(0, ui.dp(6), 0, ui.dp(18))
            })
            box.addView(modeCard("문장 퀴즈", "문장 속 빈칸에 들어갈 뜻을 입력합니다.", R.drawable.ic_lucide_book_open_active, Theme.Primary) {
                navigate(Screen.SentenceQuiz)
            })
            box.addView(modeCard("객관식 퀴즈", "단어의 뜻을 보기 중에서 고릅니다.", R.drawable.ic_lucide_brain, Theme.Blue) {
                navigate(Screen.MultipleChoiceQuiz)
            })
            box.addView(modeCard("단답형 퀴즈", "뜻을 보고 영어 단어를 직접 입력합니다.", R.drawable.ic_lucide_zap, Theme.Purple) {
                navigate(Screen.ShortAnswerQuiz)
            })
            box.addView(ui.button("단어장으로 돌아가기", Theme.Card, Theme.Text).apply {
                setOnClickListener { navigate(Screen.Words) }
            })
        }
    }

    private fun modeCard(title: String, subtitle: String, iconRes: Int, color: Int, action: () -> Unit): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(18), ui.dp(18), ui.dp(18), ui.dp(18))
            background = ui.rounded(Theme.Card, 18, Theme.Border)
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, ui.dp(12))
            }
            addView(iconBox(iconRes, color), LinearLayout.LayoutParams(ui.dp(48), ui.dp(48)).apply {
                setMargins(0, 0, ui.dp(14), 0)
            })
            addView(ui.vertical().apply {
                addView(ui.text(title, 18, Theme.Text, true))
                addView(ui.text(subtitle, 14, Theme.Muted))
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
        }
    }

    private fun iconBox(iconRes: Int, color: Int): View {
        return FrameLayout(activity).apply {
            background = ui.rounded(color, 14)
            addView(ImageView(activity).apply {
                setImageResource(iconRes)
                imageTintList = ColorStateList.valueOf(Theme.Card)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }, FrameLayout.LayoutParams(ui.dp(24), ui.dp(24), Gravity.CENTER))
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
