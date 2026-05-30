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
import com.hsmocap.app.data.AnswerGradingRepository
import com.hsmocap.app.data.GradeAnswerRequest
import com.hsmocap.app.data.GradeAnswerResult
import com.hsmocap.app.data.ImageHintRepository
import com.hsmocap.app.data.ImageHintResult
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.ui.RemoteImageView
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class SentenceQuizScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val words: List<Word>,
    private val store: StudyStore,
    private val grader: AnswerGradingRepository,
    private val imageHints: ImageHintRepository,
    private val quizIndex: Int,
    private val onSpeak: (String) -> Unit,
    private val onNext: () -> Unit,
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

            box.addView(questionCard(word))
            box.addView(ui.horizontal().apply {
                addView(ui.button("발음듣기", Theme.Blue, Theme.Card).apply {
                    setOnClickListener { onSpeak(word.exampleSentence.ifBlank { word.word }) }
                }, LinearLayout.LayoutParams(0, ui.dp(52), 1f).apply {
                    setMargins(0, ui.dp(8), ui.dp(8), ui.dp(8))
                })
                addView(ui.button("다음 문제", Theme.Card, Theme.Primary).apply {
                    setOnClickListener { onNext() }
                }, LinearLayout.LayoutParams(0, ui.dp(52), 1f).apply {
                    setMargins(0, ui.dp(8), 0, ui.dp(8))
                })
            })
            val answer = input("정답 입력")
            box.addView(answer)
            box.addView(ui.horizontal().apply {
                addView(ui.button("모르겠음", Theme.Card, Theme.Muted).apply {
                    setOnClickListener { revealAnswer(word, answer) }
                }, LinearLayout.LayoutParams(0, ui.dp(52), 1f).apply {
                    setMargins(0, 0, ui.dp(8), 0)
                })
                addView(ui.button("정답 제출", Theme.Primary, Theme.Card).apply {
                    setOnClickListener { checkAnswer(word, answer.text.toString()) }
                }, LinearLayout.LayoutParams(0, ui.dp(52), 1f))
            })
        }
    }

    private fun topBar(): View {
        return ui.vertical().apply {
            addView(progress((quizIndex % 20 + 1) * 100 / 20, Theme.Primary, Theme.Card))
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, ui.dp(14), 0, ui.dp(18))
                addView(ui.text("문장 퀴즈", 28, Theme.Text, true), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.text("${quizIndex % 20 + 1} / 20", 16, Theme.Primary, true))
            })
        }
    }

    private fun questionCard(word: Word): View {
        return ui.card().apply {
            setPadding(ui.dp(20), ui.dp(20), ui.dp(20), ui.dp(20))
            addView(ui.text("빈칸에 들어갈 한국어 뜻을 입력하세요", 14, Theme.Muted))
            addView(ui.text(word.exampleSentence, 22, Theme.Text, true).apply {
                setPadding(0, ui.dp(12), 0, ui.dp(8))
            })
            addView(ui.text(word.exampleTranslation.replace(word.quizKoreanBlank, "_____"), 20, Theme.Text))
            addView(ui.text("힌트: ${word.word}", 15, Theme.Primary, true).apply {
                setPadding(0, ui.dp(16), 0, 0)
            })
            word.imageUrl?.takeIf { it.isNotBlank() }?.let { imageUrl ->
                addImagePreview(imageUrl)
            } ?: run {
                val hintHolder = ui.vertical()
                addView(hintHolder)
                addView(ui.button("이미지 힌트 찾기", Theme.Card, Theme.Primary).apply {
                    setOnClickListener {
                        isEnabled = false
                        Toast.makeText(activity, "이미지 힌트를 찾는 중입니다.", Toast.LENGTH_SHORT).show()
                        imageHints.findHint(word) { result ->
                            activity.runOnUiThread {
                                isEnabled = true
                                result
                                    .onSuccess { showRemoteHint(hintHolder, it) }
                                    .onFailure {
                                        Toast.makeText(activity, "이미지 힌트를 찾지 못했습니다.", Toast.LENGTH_SHORT).show()
                                    }
                            }
                        }
                    }
                })
            }
        }
    }

    private fun LinearLayout.addImagePreview(imageUrl: String) {
        addView(RemoteImageView(activity, imageUrl, ui, 180).apply {
            background = ui.rounded(Theme.Card, 16, Theme.Border)
        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(180)).apply {
            setMargins(0, ui.dp(16), 0, 0)
        })
    }

    private fun showRemoteHint(holder: LinearLayout, hint: ImageHintResult) {
        holder.removeAllViews()
        holder.addImagePreview(hint.imageUrl)
        holder.addView(ui.text(hint.title, 13, Theme.Muted).apply {
            setPadding(0, ui.dp(8), 0, 0)
        })
    }

    private fun progress(value: Int, fill: Int, track: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(track, 4)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(8))
        }
        val bar = View(activity).apply { background = ui.rounded(fill, 4) }
        frame.addView(bar, FrameLayout.LayoutParams(1, ViewGroup.LayoutParams.MATCH_PARENT))
        frame.post {
            bar.layoutParams = FrameLayout.LayoutParams(
                (frame.width * value.coerceIn(0, 100) / 100).coerceAtLeast(ui.dp(4)),
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        return frame
    }

    private fun checkAnswer(word: Word, answer: String) {
        if (answer.trim().isEmpty()) {
            Toast.makeText(activity, "답을 입력해주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        Toast.makeText(activity, "채점 중입니다.", Toast.LENGTH_SHORT).show()
        grader.grade(GradeAnswerRequest(word, answer)) { result ->
            activity.runOnUiThread {
                result
                    .onSuccess { applyGrade(word, it) }
                    .onFailure {
                        applyGrade(
                            word,
                            GradeAnswerResult(
                                isCorrect = word.acceptsAnswer(answer),
                                verdict = if (word.acceptsAnswer(answer)) "correct" else "incorrect",
                                message = if (word.acceptsAnswer(answer)) "정답입니다." else "오답입니다.",
                                hint = if (word.acceptsAnswer(answer)) null else "정답: ${word.quizAnswers.firstOrNull() ?: word.quizKoreanBlank}",
                            ),
                        )
                    }
            }
        }
    }

    private fun revealAnswer(word: Word, answer: EditText) {
        val correctAnswer = word.quizAnswers.firstOrNull() ?: word.quizKoreanBlank
        answer.setText(correctAnswer)
        val recorded = store.recordAnswerOnce("sentence:${word.index}", correct = false)
        store.addWrongAnswer(word)
        val message = if (recorded) {
            "'${word.word}'의 의미는 '$correctAnswer'입니다. 다음 문제에서 다시 떠올려 보세요."
        } else {
            "이미 기록한 문제입니다. 정답은 '$correctAnswer'입니다."
        }
        Toast.makeText(activity, message, Toast.LENGTH_LONG).show()
    }

    private fun applyGrade(word: Word, grade: GradeAnswerResult) {
        if (grade.isCorrect) {
            store.recordAnswerOnce("sentence:${word.index}", correct = true)
            store.removeWrongAnswer(word)
            Toast.makeText(activity, grade.message, Toast.LENGTH_SHORT).show()
            onNext()
        } else {
            val recorded = store.recordAnswerOnce("sentence:${word.index}", correct = false)
            store.addWrongAnswer(word)
            val prefix = if (recorded) grade.message else "이미 기록한 문제입니다."
            Toast.makeText(activity, listOfNotNull(prefix, grade.hint).joinToString(" "), Toast.LENGTH_LONG).show()
        }
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

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        box.gravity = Gravity.NO_GRAVITY
        scroll.addView(box)
        build(box)
        return scroll
    }
}
