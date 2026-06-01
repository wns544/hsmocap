package com.hsmocap.app.screens

import android.app.Activity
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ScrollView
import com.hsmocap.app.R
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class WordsScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val words: List<Word>,
    private val store: StudyStore,
    private val activeCategory: String,
    private val searchQuery: String,
    private val onCategorySelected: (String) -> Unit,
    private val onSearchChanged: (String) -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return ui.vertical().apply {
            setBackgroundColor(Theme.Background)
            addView(header())
            addView(ScrollView(activity).apply {
                addView(ui.vertical().apply {
                    setPadding(ui.dp(24), ui.dp(16), ui.dp(24), ui.dp(24))
                    addView(ui.horizontal().apply {
                        addView(studyButton("학습하기", Theme.Primary) { navigate(Screen.SentenceQuiz) }, ui.weighted())
                        addView(studyButton("Shorts", Theme.Purple) { navigate(Screen.Flashcard) }, ui.weighted())
                        addView(studyButton("복습하기", Theme.Orange) { navigate(Screen.Review) }, ui.weighted())
                    })
                    val filtered = filteredWords()
                    addView(ui.horizontal().apply {
                        gravity = Gravity.CENTER_VERTICAL
                        setPadding(0, ui.dp(18), 0, ui.dp(10))
                        addView(ui.text("${filtered.size}개의 단어", 14, Theme.Muted), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                        addView(ui.text("오늘 15개 추가", 12, Theme.Primary, true).apply {
                            setPadding(ui.dp(10), ui.dp(5), ui.dp(10), ui.dp(5))
                            background = ui.rounded(0xFFECFDF5.toInt(), 14)
                        })
                    })
                    filtered.forEach { addView(wordCard(it)) }
                })
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        }
    }

    private fun header(): View {
        return ui.vertical().apply {
            setBackgroundColor(Theme.Card)
            setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(16))
            addView(ui.text("단어 학습", 30, Theme.Text, true))
            addView(input("단어 검색...").apply {
                setText(searchQuery)
                addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
                    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                        onSearchChanged(s?.toString().orEmpty())
                    }
                    override fun afterTextChanged(s: Editable?) = Unit
                })
            })
            addView(HorizontalScrollView(activity).apply {
                isHorizontalScrollBarEnabled = false
                addView(ui.horizontal().apply {
                    listOf("전체", "초급", "중급", "고급").forEach { category ->
                        addView(ui.text(category, 14, if (activeCategory == category) Theme.Card else Theme.Text, true).apply {
                            gravity = Gravity.CENTER
                            setPadding(ui.dp(16), ui.dp(8), ui.dp(16), ui.dp(8))
                            background = ui.rounded(if (activeCategory == category) Theme.Primary else Theme.Card, 18, Theme.Border)
                            setOnClickListener { onCategorySelected(category) }
                        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ui.dp(38)).apply {
                            setMargins(0, 0, ui.dp(8), 0)
                        })
                    }
                })
            })
        }
    }

    private fun wordCard(word: Word): View {
        return ui.card().apply {
            setOnClickListener { navigate(Screen.WordDetail(word.index)) }
            addView(ui.horizontal().apply {
                addView(ui.vertical().apply {
                    addView(ui.horizontal().apply {
                        gravity = Gravity.CENTER_VERTICAL
                        addView(ui.text(word.word, 20, Theme.Text, true))
                        if (store.isFavorite(word)) {
                            addView(ui.icon(R.drawable.ic_lucide_star_active, Theme.Yellow, 17), LinearLayout.LayoutParams(ui.dp(25), ui.dp(17)).apply {
                                setMargins(ui.dp(8), 0, 0, 0)
                            })
                        }
                    })
                    addView(ui.text(word.meaning, 15, Theme.Muted).apply {
                        setPadding(0, ui.dp(4), 0, ui.dp(10))
                    })
                    addView(ui.horizontal().apply {
                        gravity = Gravity.CENTER_VERTICAL
                        addView(levelBadge(word.level))
                        addView(progress(mastery(word)), LinearLayout.LayoutParams(0, ui.dp(7), 1f).apply {
                            setMargins(ui.dp(12), 0, ui.dp(8), 0)
                        })
                        addView(ui.text("${mastery(word)}%", 12, Theme.Muted))
                    })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
            })
        }
    }

    private fun levelBadge(label: String): View {
        return ui.text(label, 12, Theme.Muted, true).apply {
            gravity = Gravity.CENTER
            setPadding(ui.dp(10), ui.dp(4), ui.dp(10), ui.dp(4))
            background = ui.rounded(Theme.MutedBackground, 10)
        }
    }

    private fun progress(value: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(Theme.MutedBackground, 4)
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

    private fun studyButton(label: String, color: Int, action: () -> Unit): View {
        return ui.text(label, 14, Theme.Card, true).apply {
            gravity = Gravity.CENTER
            setPadding(ui.dp(8), ui.dp(18), ui.dp(8), ui.dp(18))
            background = ui.rounded(color, 16)
            setOnClickListener { action() }
        }
    }

    private fun input(hint: String): EditText {
        return EditText(activity).apply {
            this.hint = hint
            setSingleLine(true)
            textSize = 18f
            setTextColor(Theme.Text)
            setHintTextColor(0xFF808096.toInt())
            setPadding(ui.dp(18), 0, ui.dp(18), 0)
            background = ui.rounded(Theme.Card, 14, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(62)).apply {
                setMargins(0, ui.dp(6), 0, ui.dp(8))
            }
        }
    }

    private fun filteredWords(): List<Word> {
        return words.filter { it.isInLevel(activeCategory) && it.matches(searchQuery) }
    }

    private fun mastery(word: Word): Int {
        return if (store.isFavorite(word)) 85 else 55 + (word.index * 7 % 40)
    }
}
