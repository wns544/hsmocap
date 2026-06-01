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
import com.hsmocap.app.auth.AuthUser
import com.hsmocap.app.data.ProfileStatsCalculator
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class ProfileScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val user: AuthUser?,
    private val words: List<Word>,
    private val store: StudyStore,
    private val onEditProfile: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return scrollWithContent { box ->
            box.addView(profileHeader())
            val body = ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
            }
            body.addView(ui.horizontal().apply {
                addView(statCard("${store.streakDays()}일", "연속 학습", Theme.Orange), ui.weighted())
                addView(statCard("${store.totalAnswered()}개", "학습한 단어", Theme.Primary), ui.weighted())
            })
            body.addView(ui.horizontal().apply {
                addView(statCard("${store.wrongAnswerIds().size}개", "오답", Theme.Yellow), ui.weighted())
                addView(statCard("${store.accuracyPercent()}%", "평균 정답률", Theme.Blue), ui.weighted())
            })
            body.addView(learningStats())
            body.addView(achievements())
            body.addView(action("문장 퀴즈 계속하기", R.drawable.ic_lucide_book_open_active, Theme.Primary) { navigate(Screen.SentenceQuiz) })
            body.addView(action("즐겨찾기 보기", R.drawable.ic_lucide_star_active, Theme.Yellow) { navigate(Screen.Favorites) })
            body.addView(action("설정", R.drawable.ic_lucide_settings, Theme.Muted) { navigate(Screen.Settings) })
            box.addView(body)
        }
    }

    private fun profileHeader(): View {
        val displayName = user?.displayName ?: "워디 사용자"
        val stats = profileStats()
        val subtitle = when {
            user == null -> "로그인 정보 없음"
            user.email != null -> user.email
            else -> "user.wordy.com"
        }

        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(28))
            background = ui.rounded(Theme.Primary, 0).apply {
                cornerRadii = floatArrayOf(
                    0f, 0f,
                    0f, 0f,
                    ui.dp(32).toFloat(), ui.dp(32).toFloat(),
                    ui.dp(32).toFloat(), ui.dp(32).toFloat(),
                )
            }
            addView(ui.icon(R.drawable.ic_lucide_chevron_left, Theme.Card, 25).apply {
                background = ui.rounded(0x33FFFFFF, 12)
                setOnClickListener { navigate(Screen.Home) }
            }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, ui.dp(22), 0, ui.dp(22))
                addView(ui.text(displayName.take(1).uppercase(), 34, Theme.Card, true).apply {
                    gravity = Gravity.CENTER
                    background = ui.rounded(0x33FFFFFF, 24)
                }, LinearLayout.LayoutParams(ui.dp(86), ui.dp(86)).apply {
                    setMargins(0, 0, ui.dp(16), 0)
                })
                addView(ui.vertical().apply {
                    addView(ui.text(displayName, 25, Theme.Card, true))
                    addView(ui.text(subtitle, 14, 0xCCFFFFFF.toInt()))
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.text("프로필 수정", 13, Theme.Card, true).apply {
                    gravity = Gravity.CENTER
                    background = ui.rounded(0x33FFFFFF, 12)
                    setOnClickListener { onEditProfile() }
                }, LinearLayout.LayoutParams(ui.dp(86), ui.dp(42)))
            })
            addView(ui.vertical().apply {
                setPadding(ui.dp(18), ui.dp(14), ui.dp(18), ui.dp(14))
                background = ui.rounded(0x26FFFFFF, 18)
                addView(ui.horizontal().apply {
                    gravity = Gravity.CENTER_VERTICAL
                    addView(tintedIcon(R.drawable.ic_lucide_award, Theme.Card, 18))
                    addView(ui.text("레벨 ${stats.level}", 16, Theme.Card, true).apply {
                        setPadding(ui.dp(8), 0, 0, 0)
                    }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                    addView(ui.text("${stats.xp} / ${stats.nextLevelXp} XP", 14, Theme.Card))
                })
                addView(progress(stats.levelProgressPercent, 0xFFFFF1B8.toInt(), 0x45FFFFFF))
                addView(ui.text("레벨 ${stats.level + 1}까지 ${stats.remainingXp}XP 남음", 12, 0x99FFFFFF.toInt()))
            })
        }
    }

    private fun learningStats(): View {
        val totalWords = words.size.coerceAtLeast(1)
        val learned = store.totalAnswered().coerceAtMost(totalWords)
        val beginner = words.count { it.level == "초급" }
        val intermediate = words.count { it.level == "중급" }
        val advanced = words.count { it.level == "고급" }
        return ui.card().apply {
            addView(ui.text("학습 통계", 18, Theme.Text, true))
            addView(progressRow("전체 진행", learned * 100 / totalWords, "${learned} / ${words.size}개"))
            addView(progressRow("초급 단어", levelProgress("초급"), "${beginner}개"))
            addView(progressRow("중급 단어", levelProgress("중급"), "${intermediate}개"))
            addView(progressRow("고급 단어", levelProgress("고급"), "${advanced}개"))
        }
    }

    private fun progressRow(label: String, percent: Int, value: String): View {
        return ui.vertical().apply {
            setPadding(0, ui.dp(12), 0, 0)
            addView(ui.horizontal().apply {
                addView(ui.text(label, 14, Theme.Muted), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.text(value, 14, Theme.Text))
            })
            addView(progress(percent, Theme.Primary, Theme.Card))
        }
    }

    private fun achievements(): View {
        val items = ProfileStatsCalculator.achievementStates(
            totalAnswered = store.totalAnswered(),
            correctAnswered = store.correctAnswered(),
            streakDays = store.streakDays(),
            accuracyPercent = store.accuracyPercent(),
        )
        return ui.vertical().apply {
            addView(ui.text("획득한 업적", 18, Theme.Text, true).apply {
                setPadding(0, ui.dp(18), 0, ui.dp(10))
            })
            items.chunked(3).forEach { row ->
                addView(ui.horizontal().apply {
                    row.forEach { item ->
                        addView(achievement(item.first, item.second), ui.weighted())
                    }
                })
            }
        }
    }

    private fun achievement(name: String, earned: Boolean): View {
        return ui.vertical().apply {
            gravity = Gravity.CENTER
            setPadding(ui.dp(8), ui.dp(12), ui.dp(8), ui.dp(12))
            background = ui.rounded(if (earned) Theme.Card else Theme.MutedBackground, 16, if (earned) Theme.Primary else Theme.Border)
            addView(tintedIcon(if (earned) R.drawable.ic_lucide_trophy else R.drawable.ic_lucide_award, if (earned) Theme.Primary else Theme.Muted, 24).apply { foregroundGravity = Gravity.CENTER })
            addView(ui.text(name, 12, Theme.Text, true).apply {
                gravity = Gravity.CENTER
            })
        }
    }

    private fun progress(value: Int, fill: Int, track: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(track, 4)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(8)).apply {
                setMargins(0, ui.dp(10), 0, ui.dp(6))
            }
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

    private fun statCard(value: String, label: String, color: Int): View {
        return ui.card().apply {
            addView(ui.text(value, 27, color, true).apply { gravity = Gravity.CENTER })
            addView(ui.text(label, 13, Theme.Muted).apply { gravity = Gravity.CENTER })
        }
    }

    private fun action(title: String, iconRes: Int, color: Int, action: () -> Unit): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(18), ui.dp(18), ui.dp(18), ui.dp(18))
            background = ui.rounded(Theme.Card, 18, Theme.Border)
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(6), 0, ui.dp(8))
            }
            addView(FrameLayout(activity).apply {
                background = ui.rounded(color, 12)
                addView(tintedIcon(iconRes, Theme.Card, 20), FrameLayout.LayoutParams(ui.dp(20), ui.dp(20), Gravity.CENTER))
            }, LinearLayout.LayoutParams(ui.dp(42), ui.dp(42)))
            addView(ui.text(title, 18, Theme.Text, true).apply {
                setPadding(ui.dp(14), 0, 0, 0)
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
        }
    }

    private fun profileStats() = ProfileStatsCalculator.calculate(
        totalAnswered = store.totalAnswered(),
        correctAnswered = store.correctAnswered(),
        streakDays = store.streakDays(),
        favoriteCount = store.favoriteIds().size,
        accuracyPercent = store.accuracyPercent(),
    )

    private fun levelProgress(level: String): Int {
        val levelWords = words.filter { it.level == level }
        if (levelWords.isEmpty()) return 0
        val touchedIds = store.favoriteIds() + store.wrongAnswerIds()
        val touched = levelWords.count { touchedIds.contains(it.index) }
        return maxOf(touched, store.totalAnswered().coerceAtMost(levelWords.size)) * 100 / levelWords.size
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    private fun tintedIcon(iconRes: Int, color: Int, sizeDp: Int): ImageView {
        return ImageView(activity).apply {
            setImageResource(iconRes)
            imageTintList = ColorStateList.valueOf(color)
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(ui.dp(sizeDp), ui.dp(sizeDp))
        }
    }

}
