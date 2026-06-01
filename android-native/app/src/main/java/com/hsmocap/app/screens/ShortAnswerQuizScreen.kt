package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Toast
import com.hsmocap.app.R
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class ShortAnswerQuizScreen(
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
                addView(ui.text("다음 뜻에 해당하는 영어 단어는?", 15, Theme.Muted))
                addView(ui.text(word.meaning, 28, Theme.Text, true).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(20), 0, ui.dp(8))
                })
                addView(ui.text("힌트: ${word.word.firstOrNull()?.uppercaseChar() ?: '?'}로 시작", 14, Theme.Primary, true).apply {
                    gravity = Gravity.CENTER
                })
            })
            val answer = input("영어 단어 입력")
            box.addView(answer)
            box.addView(ui.button("정답 확인", Theme.Primary, Theme.Card).apply {
                setOnClickListener { check(word, answer.text.toString()) }
            })
        }
    }

    private fun topBar(): View {
        return ui.vertical().apply {
            addView(progress(((quizIndex % QUIZ_TOTAL) + 1) * 100 / QUIZ_TOTAL))
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, ui.dp(14), 0, ui.dp(18))
                addView(ui.icon(R.drawable.ic_lucide_x, Theme.Muted, 22).apply {
                    setOnClickListener { navigate(Screen.QuizStart) }
                }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
                addView(ui.vertical().apply {
                    gravity = Gravity.CENTER
                    addView(ui.text("단답형 퀴즈", 14, Theme.Muted).apply { gravity = Gravity.CENTER })
                    addView(ui.text("${quizIndex + 1} / $QUIZ_TOTAL · 정답 $correctCount", 17, Theme.Text, true).apply {
                        gravity = Gravity.CENTER
                    })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(View(activity), LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
            })
        }
    }

    private fun check(word: Word, answer: String) {
        val correct = answer.trim().equals(word.word, ignoreCase = true)
        if (correct) {
            store.recordAnswerOnce("short:${word.index}", correct = true)
            store.removeWrongAnswer(word)
            Toast.makeText(activity, "정답입니다.", Toast.LENGTH_SHORT).show()
        } else {
            store.recordAnswerOnce("short:${word.index}", correct = false)
            store.addWrongAnswer(word)
            Toast.makeText(activity, "오답입니다. 정답: ${word.word}", Toast.LENGTH_LONG).show()
        }
        onAnswered(correct)
    }

    private fun input(hint: String): EditText {
        return EditText(activity).apply {
            this.hint = hint
            imeOptions = EditorInfo.IME_ACTION_DONE
            setSingleLine(true)
            textSize = 18f
            setTextColor(Theme.Text)
            setHintTextColor(0xFF808096.toInt())
            setPadding(ui.dp(18), 0, ui.dp(18), 0)
            background = ui.rounded(Theme.Card, 16)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(62)).apply {
                setMargins(0, ui.dp(16), 0, ui.dp(8))
            }
        }
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
