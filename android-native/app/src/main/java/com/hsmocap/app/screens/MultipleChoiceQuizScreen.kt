package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Toast
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class MultipleChoiceQuizScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val words: List<Word>,
    private val store: StudyStore,
    private val quizIndex: Int,
    private val correctCount: Int,
    private val onAnswered: (Boolean) -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    private val word: Word? = words.getOrNull(quizIndex.coerceAtLeast(0) % words.size.coerceAtLeast(1))

    fun view(): View {
        return scrollWithContent { box ->
            box.setPadding(ui.dp(24), ui.dp(44), ui.dp(24), ui.dp(24))
            box.addView(topBar())

            if (word == null) {
                box.addView(ui.text("학습할 단어가 없습니다.", 18, Theme.Muted))
                return@scrollWithContent
            }

            box.addView(ui.card().apply {
                setPadding(ui.dp(20), ui.dp(24), ui.dp(20), ui.dp(24))
                addView(ui.text("이 단어의 뜻은?", 15, Theme.Muted))
                addView(ui.text(word.word, 34, Theme.Text, true).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(20), 0, ui.dp(8))
                })
                addView(ui.text(word.level, 14, Theme.Primary, true).apply { gravity = Gravity.CENTER })
            })

            options(word).forEach { option ->
                box.addView(ui.button(option, Theme.Card, Theme.Text).apply {
                    setOnClickListener { choose(word, option) }
                })
            }
        }
    }

    private fun topBar(): View {
        return ui.vertical().apply {
            addView(progress(((quizIndex % QUIZ_TOTAL) + 1) * 100 / QUIZ_TOTAL))
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, ui.dp(14), 0, ui.dp(18))
                addView(ui.text("×", 22, Theme.Muted, true).apply {
                    gravity = Gravity.CENTER
                    setOnClickListener { navigate(Screen.QuizStart) }
                }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
                addView(ui.vertical().apply {
                    gravity = Gravity.CENTER
                    addView(ui.text("객관식 퀴즈", 14, Theme.Muted).apply { gravity = Gravity.CENTER })
                    addView(ui.text("${quizIndex + 1} / $QUIZ_TOTAL · 정답 $correctCount", 17, Theme.Text, true).apply {
                        gravity = Gravity.CENTER
                    })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(View(activity), LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
            })
        }
    }

    private fun options(answer: Word): List<String> {
        val distractors = words
            .filter { it.index != answer.index && it.meaning.isNotBlank() }
            .sortedBy { (it.index * 37 + quizIndex * 11) % 997 }
            .map { it.meaning }
            .distinct()
            .take(3)
        return (distractors + answer.meaning)
            .filter { it.isNotBlank() }
            .distinct()
            .sortedBy { it.length * 31 + it.hashCode().mod(997) }
    }

    private fun choose(word: Word, option: String) {
        val correct = option == word.meaning
        if (correct) {
            store.recordAnswerOnce("multiple:${word.index}", correct = true)
            store.removeWrongAnswer(word)
            Toast.makeText(activity, "정답입니다.", Toast.LENGTH_SHORT).show()
        } else {
            store.recordAnswerOnce("multiple:${word.index}", correct = false)
            store.addWrongAnswer(word)
            Toast.makeText(activity, "오답입니다. 정답: ${word.meaning}", Toast.LENGTH_LONG).show()
        }
        onAnswered(correct)
    }

    private fun progress(value: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(Theme.Card, 4, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(8))
        }
        val bar = View(activity).apply { background = ui.rounded(Theme.Primary, 4) }
        frame.addView(bar, FrameLayout.LayoutParams(1, ViewGroup.LayoutParams.MATCH_PARENT))
        frame.post {
            bar.layoutParams = FrameLayout.LayoutParams(
                (frame.width * value.coerceIn(0, 100) / 100).coerceAtLeast(ui.dp(4)),
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        return frame
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    companion object {
        const val QUIZ_TOTAL = 10
    }
}
