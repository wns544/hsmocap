package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import com.hsmocap.app.R
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class FlashcardScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val title: String = "플래시카드",
    private val words: List<Word>,
    private val store: StudyStore,
    private val cardIndex: Int,
    private val showingAnswer: Boolean,
    private val onFlip: () -> Unit,
    private val onNext: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    private val word: Word? = words.getOrNull(cardIndex.coerceAtLeast(0) % words.size.coerceAtLeast(1))

    fun view(): View {
        return scrollWithContent { box ->
            box.setPadding(ui.dp(24), ui.dp(44), ui.dp(24), ui.dp(24))
            box.addView(topBar())

            if (word == null) {
                box.addView(ui.text("학습할 단어가 없습니다.", 18, Theme.Muted))
                return@scrollWithContent
            }

            box.addView(card(word))
            box.addView(ui.text(if (showingAnswer) "위로 외웠어요 · 아래로 다시 볼래요" else "카드를 눌러 뜻을 확인하세요", 13, Theme.Muted).apply {
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, ui.dp(10))
            })
            box.addView(ui.button(if (showingAnswer) "단어만 보기" else "뜻 보기", Theme.Primary, Theme.Card).apply {
                setOnClickListener { onFlip() }
            })
            box.addView(ui.horizontal().apply {
                addView(ui.button("외웠어요", 0xFFEFFFF8.toInt(), Theme.Primary).apply {
                    setOnClickListener {
                        store.recordAnswerOnce("flashcard:${word.index}", correct = true)
                        store.removeWrongAnswer(word)
                        onNext()
                    }
                }, ui.weighted())
                addView(ui.button("다시 볼래요", 0xFFFFF7ED.toInt(), Theme.Orange).apply {
                    setOnClickListener {
                        store.recordAnswerOnce("flashcard:${word.index}", correct = false)
                        store.addWrongAnswer(word)
                        onNext()
                    }
                }, ui.weighted())
            })
            box.addView(ui.button("단어장으로 이동", Theme.Card, Theme.Text).apply {
                setOnClickListener { navigate(Screen.Words) }
            })
        }
    }

    private fun topBar(): View {
        val total = words.size.coerceAtLeast(1)
        val progress = ((cardIndex % total) + 1) * 100 / total
        return ui.vertical().apply {
            addView(progress(progress, Theme.Primary, Theme.Card))
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, ui.dp(14), 0, ui.dp(18))
                addView(ui.icon(R.drawable.ic_lucide_x, Theme.Muted, 22).apply {
                    setOnClickListener { navigate(Screen.Home) }
                }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
                addView(ui.vertical().apply {
                    gravity = Gravity.CENTER
                    addView(ui.text(title, 14, Theme.Muted).apply { gravity = Gravity.CENTER })
                    addView(ui.text("${cardIndex + 1} / $total", 17, Theme.Text, true).apply { gravity = Gravity.CENTER })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.icon(R.drawable.ic_lucide_refresh_cw, Theme.Muted, 22).apply {
                    setOnClickListener { navigate(Screen.Flashcard) }
                }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
            })
        }
    }

    private fun card(word: Word): View {
        return ui.vertical().apply {
            gravity = Gravity.CENTER
            setPadding(ui.dp(24), ui.dp(42), ui.dp(24), ui.dp(42))
            background = ui.rounded(Theme.Card, 22, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(24), 0, ui.dp(16))
            }
            addView(ui.text(word.word, 40, Theme.Text, true).apply { gravity = Gravity.CENTER })
            addView(ui.text(word.level, 14, Theme.Muted, true).apply {
                gravity = Gravity.CENTER
                setPadding(0, ui.dp(8), 0, ui.dp(18))
            })
            if (showingAnswer) {
                addView(ui.text(word.meaning, 24, Theme.Primary, true).apply { gravity = Gravity.CENTER })
                addView(ui.text(word.exampleSentence, 17, Theme.Muted).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(18), 0, 0)
                })
            }
        }
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

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }
}
