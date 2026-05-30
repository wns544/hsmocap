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
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class WordDetailScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val word: Word?,
    private val store: StudyStore,
    private val onSpeak: (String) -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return scrollWithContent { box ->
            if (word == null) {
                box.setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
                box.addView(ui.text("‹ 뒤로", 20, Theme.Primary, true).apply {
                    setOnClickListener { navigate(Screen.Words) }
                })
                box.addView(ui.text("단어를 찾을 수 없습니다.", 20, Theme.Muted))
                return@scrollWithContent
            }

            box.addView(header(word))
            val body = ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
            }
            body.addView(progressCard(word))
            body.addView(tabBar())
            body.addView(infoCard("의미", word.meaning))
            body.addView(infoCard("유의어", "Fortune · Luck · Chance"))
            body.addView(exampleCard(word.exampleSentence, word.exampleTranslation))
            body.addView(infoCard("연관 단어", "Fortune · Destiny · Fate"))
            body.addView(ui.button("퀴즈로 복습하기", Theme.Primary, Theme.Card).apply {
                setOnClickListener { navigate(Screen.SentenceQuiz) }
            })
            body.addView(ui.button(if (store.isFavorite(word)) "즐겨찾기 해제" else "즐겨찾기 추가", Theme.Card, Theme.Primary).apply {
                setOnClickListener {
                    store.toggleFavorite(word)
                    navigate(Screen.WordDetail(word.index))
                }
            })
            box.addView(body)
        }
    }

    private fun header(word: Word): View {
        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
            background = ui.rounded(Theme.Primary, 0).apply {
                cornerRadii = floatArrayOf(
                    0f, 0f,
                    0f, 0f,
                    ui.dp(32).toFloat(), ui.dp(32).toFloat(),
                    ui.dp(32).toFloat(), ui.dp(32).toFloat(),
                )
            }
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(headerButton("‹") { navigate(Screen.Words) })
                addView(View(activity), LinearLayout.LayoutParams(0, 1, 1f))
                addView(headerIconButton(if (store.isFavorite(word)) R.drawable.ic_lucide_star_active else R.drawable.ic_lucide_star) {
                    store.toggleFavorite(word)
                    navigate(Screen.WordDetail(word.index))
                })
            })
            addView(ui.text(word.word, 38, Theme.Card, true).apply {
                gravity = Gravity.CENTER
                setPadding(0, ui.dp(28), 0, ui.dp(2))
            })
            addView(ui.text("/${word.word.lowercase()}/", 15, 0xCCFFFFFF.toInt()).apply {
                gravity = Gravity.CENTER
            })
            addView(ui.text(word.level, 13, Theme.Card, true).apply {
                gravity = Gravity.CENTER
                setPadding(ui.dp(12), ui.dp(5), ui.dp(12), ui.dp(5))
                background = ui.rounded(0x33FFFFFF, 14)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                setMargins(0, ui.dp(12), 0, ui.dp(18))
            })
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER
                setPadding(ui.dp(16), ui.dp(14), ui.dp(16), ui.dp(14))
                background = ui.rounded(0x33FFFFFF, 18)
                setOnClickListener { onSpeak(word.word) }
                addView(tintedIcon(R.drawable.ic_lucide_volume_2, Theme.Card, 18))
                addView(ui.text("발음 듣기", 16, Theme.Card, true).apply {
                    setPadding(ui.dp(8), 0, 0, 0)
                })
            })
        }
    }

    private fun headerButton(label: String, action: () -> Unit): View {
        return ui.text(label, 25, Theme.Card, true).apply {
            gravity = Gravity.CENTER
            background = ui.rounded(0x33FFFFFF, 12)
            setOnClickListener { action() }
        }.also {
            it.layoutParams = LinearLayout.LayoutParams(ui.dp(44), ui.dp(44))
        }
    }

    private fun headerIconButton(iconRes: Int, action: () -> Unit): View {
        return FrameLayout(activity).apply {
            background = ui.rounded(0x33FFFFFF, 12)
            setOnClickListener { action() }
            addView(tintedIcon(iconRes, Theme.Card, 22), FrameLayout.LayoutParams(ui.dp(22), ui.dp(22), Gravity.CENTER))
            layoutParams = LinearLayout.LayoutParams(ui.dp(44), ui.dp(44))
        }
    }

    private fun progressCard(word: Word): View {
        val value = mastery(word)
        return ui.card().apply {
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(tintedIcon(R.drawable.ic_lucide_target, Theme.Primary, 20))
                addView(ui.text("학습 진행도", 16, Theme.Text).apply {
                    setPadding(ui.dp(8), 0, 0, 0)
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.text("$value%", 16, Theme.Primary, true))
            })
            addView(progress(value), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(8)).apply {
                setMargins(0, ui.dp(12), 0, 0)
            })
        }
    }

    private fun tabBar(): View {
        return ui.horizontal().apply {
            setPadding(ui.dp(4), ui.dp(4), ui.dp(4), ui.dp(4))
            background = ui.rounded(Theme.Card, 14, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(8), 0, ui.dp(16))
            }
            addView(tab("뜻", true), LinearLayout.LayoutParams(0, ui.dp(44), 1f))
            addView(tab("예문", false), LinearLayout.LayoutParams(0, ui.dp(44), 1f))
            addView(tab("연관 단어", false), LinearLayout.LayoutParams(0, ui.dp(44), 1f))
        }
    }

    private fun tab(label: String, active: Boolean): View {
        return ui.text(label, 14, if (active) Theme.Text else Theme.Muted, true).apply {
            gravity = Gravity.CENTER
            if (active) background = ui.rounded(Theme.Card, 10)
        }
    }

    private fun infoCard(label: String, value: String): View {
        return ui.card().apply {
            addView(ui.text(label, 14, Theme.Muted))
            addView(ui.text(value.ifBlank { "-" }, 18, Theme.Text, true).apply {
                setPadding(0, ui.dp(6), 0, 0)
            })
        }
    }

    private fun exampleCard(sentence: String, translation: String): View {
        return ui.card().apply {
            addView(ui.horizontal().apply {
                addView(FrameLayout(activity).apply {
                    background = ui.rounded(0xFFE7F8F1.toInt(), 12)
                    addView(tintedIcon(R.drawable.ic_lucide_check, Theme.Primary, 16), FrameLayout.LayoutParams(ui.dp(16), ui.dp(16), Gravity.CENTER))
                }, LinearLayout.LayoutParams(ui.dp(28), ui.dp(28)).apply {
                    setMargins(0, ui.dp(2), ui.dp(10), 0)
                })
                addView(ui.vertical().apply {
                    addView(ui.text(sentence.ifBlank { "-" }, 17, Theme.Text))
                    addView(ui.text(translation.ifBlank { "-" }, 15, Theme.Muted).apply {
                        setPadding(0, ui.dp(10), 0, 0)
                    })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
        }
    }

    private fun progress(value: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(Theme.Card, 4, Theme.Border)
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

    private fun mastery(word: Word): Int {
        return if (store.isFavorite(word)) 85 else 55 + (word.index * 7 % 40)
    }

    private fun tintedIcon(iconRes: Int, color: Int, sizeDp: Int): ImageView {
        return ImageView(activity).apply {
            setImageResource(iconRes)
            imageTintList = ColorStateList.valueOf(color)
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(ui.dp(sizeDp), ui.dp(sizeDp))
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
