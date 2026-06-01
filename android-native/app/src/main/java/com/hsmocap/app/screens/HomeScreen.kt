package com.hsmocap.app.screens

import android.app.Activity
import android.content.res.ColorStateList
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.hsmocap.app.R
import com.hsmocap.app.data.NativeSettings
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class HomeScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val words: List<Word>,
    private val store: StudyStore,
    private val settings: NativeSettings,
    private val userName: String,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return scrollWithContent { box ->
            box.setPadding(0, 0, 0, ui.dp(18))
            box.addView(hero())

            val body = ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(26))
            }
            body.addView(ui.horizontal().apply {
                addView(statCard("${store.totalAnswered()}", "학습한 단어", R.drawable.ic_lucide_book_open_active, Theme.Blue), statParams(0, 6))
                addView(statCard("${store.accuracyPercent()}%", "정답률", R.drawable.ic_lucide_target, Theme.Primary), statParams(6, 6))
                addView(statCard("${store.streakDays()}일", "연속 학습", R.drawable.ic_lucide_trending_up, Theme.Orange), statParams(6, 0))
            })
            body.addView(section("빠른 시작"))
            body.addView(actionCard("학습하기", "문장 퀴즈로 단어를 학습해요", R.drawable.ic_lucide_book_open_active, Theme.Primary) {
                navigate(Screen.SentenceQuiz)
            })
            body.addView(actionCard("Shorts 학습", "카드 넘기기로 빠르게 복습해요", R.drawable.ic_lucide_layers, Theme.Purple) {
                navigate(Screen.Flashcard)
            })
            body.addView(actionCard("복습하기", "${store.wrongAnswerIds().size}개의 복습 대기 단어", R.drawable.ic_lucide_trending_up, Theme.Orange) {
                navigate(Screen.Review)
            })

            val recentHeader = ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(section("최근 학습 단어"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.text("전체 보기", 15, Theme.Primary, true).apply {
                    setOnClickListener { navigate(Screen.Words) }
                })
            }
            body.addView(recentHeader)
            words.take(3).forEach { body.addView(wordCard(it)) }
            box.addView(body)
        }
    }

    private fun hero(): View {
        val dailyGoal = settings.dailyGoal.coerceAtLeast(1)
        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(54), ui.dp(24), ui.dp(28))
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
                addView(ui.vertical().apply {
                    addView(ui.text(todayLabel(), 14, 0xC0FFFFFF.toInt()))
                    addView(ui.text("안녕하세요,", 30, Theme.Card, true))
                    addView(ui.text("${userName.ifBlank { "워디 사용자" }}님", 30, Theme.Card, true).apply {
                        maxLines = 1
                        ellipsize = TextUtils.TruncateAt.END
                    })
                    addView(ui.text("오늘도 목표 단어를 차근차근 채워봐요.", 16, 0xD0FFFFFF.toInt()))
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.text("프로필", 14, Theme.Card, true).apply {
                    gravity = Gravity.CENTER
                    background = ui.rounded(0x33FFFFFF, 24)
                    setOnClickListener { navigate(Screen.Profile) }
                }, LinearLayout.LayoutParams(ui.dp(72), ui.dp(48)))
            })

            addView(ui.vertical().apply {
                setPadding(ui.dp(18), ui.dp(16), ui.dp(18), ui.dp(16))
                background = ui.rounded(0x26FFFFFF, 16)
                addView(ui.horizontal().apply {
                    addView(ui.text("오늘의 학습 진행도", 14, 0xD0FFFFFF.toInt()), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                    addView(ui.text("${store.todayAnswered()} / $dailyGoal 단어", 14, Theme.Card))
                })
                addView(progress(store.todayAnswered() * 100 / dailyGoal, Theme.HeroProgress, 0x33FFFFFF))
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(22), 0, 0)
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
                            addView(tintedIcon(R.drawable.ic_lucide_star_active, Theme.Yellow, 17), LinearLayout.LayoutParams(ui.dp(25), ui.dp(17)).apply {
                                setMargins(ui.dp(8), 0, 0, 0)
                            })
                        }
                    })
                    addView(ui.text(word.meaning, 15, Theme.Muted))
                    addView(ui.text(word.level, 12, Theme.Muted, true))
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(tintedIcon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
            })
        }
    }

    private fun actionCard(title: String, subtitle: String, icon: Int, color: Int, action: () -> Unit): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(16), ui.dp(16), ui.dp(16), ui.dp(16))
            background = ui.rounded(Theme.Card, 16, Theme.Border)
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, ui.dp(12))
            }
            addView(iconBox(icon, color, 48, 24, 12), LinearLayout.LayoutParams(ui.dp(48), ui.dp(48)))
            addView(ui.vertical().apply {
                setPadding(ui.dp(16), 0, 0, 0)
                addView(ui.text(title, 16, Theme.Text, false).apply {
                    includeFontPadding = false
                    setPadding(0, 0, 0, ui.dp(4))
                })
                addView(ui.text(subtitle, 14, Theme.Muted).apply { includeFontPadding = false })
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(tintedIcon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
        }
    }

    private fun statCard(value: String, label: String, icon: Int, color: Int): View {
        return ui.card().apply {
            setPadding(ui.dp(16), ui.dp(16), ui.dp(16), ui.dp(16))
            background = ui.rounded(Theme.Card, 16, Theme.Border)
            addView(iconBox(icon, color, 40, 20, 12), LinearLayout.LayoutParams(ui.dp(40), ui.dp(40)).apply {
                setMargins(0, 0, 0, ui.dp(12))
            })
            addView(ui.text(value, 24, Theme.Text).apply {
                includeFontPadding = false
                setPadding(0, 0, 0, ui.dp(4))
            })
            addView(ui.text(label, 12, Theme.Muted).apply { includeFontPadding = false })
        }
    }

    private fun section(label: String): TextView {
        return ui.text(label, 20, Theme.Text, false).apply {
            includeFontPadding = false
            setPadding(0, ui.dp(24), 0, ui.dp(16))
        }
    }

    private fun progress(value: Int, fill: Int, track: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(track, 5)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(8)).apply {
                setMargins(0, ui.dp(10), 0, ui.dp(8))
            }
        }
        val bar = View(activity).apply { background = ui.rounded(fill, 5) }
        frame.addView(bar, FrameLayout.LayoutParams(1, ViewGroup.LayoutParams.MATCH_PARENT))
        frame.post {
            bar.layoutParams = FrameLayout.LayoutParams(
                (frame.width * value.coerceIn(0, 100) / 100).coerceAtLeast(ui.dp(4)),
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        return frame
    }

    private fun iconBox(icon: Int, backgroundColor: Int, boxDp: Int, iconDp: Int, radiusDp: Int): FrameLayout {
        return FrameLayout(activity).apply {
            background = ui.rounded(backgroundColor, radiusDp)
            addView(tintedIcon(icon, Theme.Card, iconDp), FrameLayout.LayoutParams(ui.dp(iconDp), ui.dp(iconDp), Gravity.CENTER))
        }
    }

    private fun tintedIcon(icon: Int, color: Int, sizeDp: Int): ImageView {
        return ImageView(activity).apply {
            setImageResource(icon)
            imageTintList = ColorStateList.valueOf(color)
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(ui.dp(sizeDp), ui.dp(sizeDp))
        }
    }

    private fun statParams(left: Int, right: Int): LinearLayout.LayoutParams {
        return LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
            setMargins(ui.dp(left), 0, ui.dp(right), 0)
        }
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    private fun todayLabel(): String = SimpleDateFormat("M월 d일 E", Locale.KOREAN).format(Date())
}
