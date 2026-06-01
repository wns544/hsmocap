package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView
import com.hsmocap.app.R
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class ReviewScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val words: List<Word>,
    private val store: StudyStore,
    private val onStartReviewCards: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    private val reviewWords: List<Word> = words.filter { store.wrongAnswerIds().contains(it.index) }

    fun view(): View {
        return scrollWithContent { box ->
            box.setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
            box.addView(ui.text("오답 복습", 30, Theme.Text, true))
            box.addView(ui.text("${reviewWords.size}개의 다시 볼 단어", 16, Theme.Muted))

            if (reviewWords.isEmpty()) {
                box.addView(emptyState())
                box.addView(tipsCard())
                return@scrollWithContent
            }

            box.addView(summaryCard())
            box.addView(ui.button("오답 플래시카드 시작", Theme.Orange, Theme.Card).apply {
                setOnClickListener { onStartReviewCards() }
            })
            box.addView(ui.button("오답 목록 비우기", Theme.Card, 0xFFDC2626.toInt()).apply {
                setOnClickListener {
                    store.clearWrongAnswers()
                    navigate(Screen.Review)
                }
            })
            reviewWords.forEach { box.addView(wordCard(it)) }
            box.addView(tipsCard())
        }
    }

    private fun summaryCard(): View {
        return ui.card().apply {
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.text("!", 28, Theme.Orange, true).apply {
                    gravity = Gravity.CENTER
                    background = ui.rounded(0xFFFFF7ED.toInt(), 18)
                }, LinearLayout.LayoutParams(ui.dp(54), ui.dp(54)).apply {
                    setMargins(0, 0, ui.dp(14), 0)
                })
                addView(ui.vertical().apply {
                    addView(ui.text("복습이 필요한 단어", 18, Theme.Text, true))
                    addView(ui.text("틀린 단어 ${reviewWords.size}개를 다시 확인하세요.", 14, Theme.Muted))
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
        }
    }

    private fun emptyState(): View {
        return ui.card().apply {
            setPadding(ui.dp(18), ui.dp(24), ui.dp(18), ui.dp(24))
            addView(ui.text("아직 오답이 없습니다.", 21, Theme.Text, true))
            addView(ui.text("문장 퀴즈에서 틀린 단어가 여기에 쌓입니다.", 16, Theme.Muted))
            addView(ui.button("문장 퀴즈 풀기", Theme.Primary, Theme.Card).apply {
                setOnClickListener { navigate(Screen.SentenceQuiz) }
            })
        }
    }

    private fun tipsCard(): View {
        return ui.card().apply {
            background = ui.rounded(0xFFF0F9FF.toInt(), 18, Theme.Border)
            addView(ui.text("학습 팁", 18, Theme.Text, true))
            addView(ui.text("오답은 잊기 전에 바로 복습하는 것이 효과적입니다.\n예문과 함께 단어를 외우면 기억에 오래 남습니다.", 14, Theme.Muted).apply {
                setPadding(0, ui.dp(8), 0, 0)
            })
        }
    }

    private fun wordCard(word: Word): View {
        return ui.card().apply {
            setOnClickListener { navigate(Screen.WordDetail(word.index)) }
            addView(ui.horizontal().apply {
                addView(ui.vertical().apply {
                    addView(ui.text(word.word, 20, Theme.Text, true))
                    addView(ui.text(word.meaning, 15, Theme.Primary, true))
                    addView(ui.text(word.exampleSentence, 14, Theme.Muted).apply {
                        setPadding(0, ui.dp(8), 0, 0)
                    })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
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
