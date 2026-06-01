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
import com.hsmocap.app.data.CommunityPost
import com.hsmocap.app.data.CommunityRepository
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class WordListScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val title: String,
    private val emptyMessage: String,
    private val words: List<Word>,
    private val store: StudyStore,
    private val navigate: (Screen) -> Unit,
    private val communityRepository: CommunityRepository? = null,
    private val userId: String? = null,
) {
    fun view(): View {
        return scrollWithContent { box ->
            if (title == "즐겨찾기") {
                box.addView(favoritesHeader())
                val body = ui.vertical().apply {
                    setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
                }
                if (words.isEmpty()) {
                    body.addView(emptyFavorites())
                } else {
                    body.addView(studyButtons())
                    body.addView(collectionGrid())
                    body.addView(ui.text("${words.size}개의 단어", 14, Theme.Muted).apply {
                        setPadding(0, 0, 0, ui.dp(10))
                    })
                    words.forEach { body.addView(wordCard(it)) }
                    body.addView(tipsCard())
                }
                body.addView(savedPostsSection())
                box.addView(body)
            } else {
                box.setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
                box.addView(ui.text(title, 30, Theme.Text, true))
                if (words.isEmpty()) {
                    box.addView(ui.text(emptyMessage, 18, Theme.Muted))
                } else {
                    words.forEach { box.addView(wordCard(it)) }
                }
            }
        }
    }

    private fun favoritesHeader(): View {
        val average = if (words.isEmpty()) 0 else words.map { mastery(it) }.average().toInt()
        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(28))
            background = ui.rounded(Theme.Yellow, 0).apply {
                cornerRadii = floatArrayOf(
                    0f, 0f,
                    0f, 0f,
                    ui.dp(32).toFloat(), ui.dp(32).toFloat(),
                    ui.dp(32).toFloat(), ui.dp(32).toFloat(),
                )
            }
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(FrameLayout(activity).apply {
                    background = ui.rounded(0x33FFFFFF, 18)
                    addView(tintedIcon(R.drawable.ic_lucide_star_active, Theme.Card, 26), FrameLayout.LayoutParams(ui.dp(26), ui.dp(26), Gravity.CENTER))
                }, LinearLayout.LayoutParams(ui.dp(56), ui.dp(56)).apply {
                    setMargins(0, 0, ui.dp(12), 0)
                })
                addView(ui.vertical().apply {
                    addView(ui.text("즐겨찾기", 30, Theme.Card, true))
                    addView(ui.text("단어, 문장, 게시글, 컬렉션을 한눈에 모아보세요", 15, 0xCCFFFFFF.toInt()))
                })
            })
            addView(ui.horizontal().apply {
                setPadding(ui.dp(18), ui.dp(14), ui.dp(18), ui.dp(14))
                background = ui.rounded(0x26FFFFFF, 18)
                addView(headerStat("${words.size}", "단어"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(headerStat("${words.size}", "문장"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(headerStat("$average%", "평균 학습률"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(24), 0, 0)
            })
        }
    }

    private fun collectionGrid(): View {
        val reviewCount = words.count { mastery(it) < 70 }
        return ui.vertical().apply {
            addView(ui.text("컬렉션", 20, Theme.Text, true).apply {
                setPadding(0, 0, 0, ui.dp(10))
            })
            addView(ui.horizontal().apply {
                addView(collectionItem("플래시카드", "${words.size}개", R.drawable.ic_lucide_zap, Theme.Primary) { navigate(Screen.Flashcard) }, ui.weighted())
                addView(collectionItem("문장학습", "${words.size}개", R.drawable.ic_lucide_book_open_active, Theme.Blue) { navigate(Screen.SentenceQuiz) }, ui.weighted())
            })
            addView(ui.horizontal().apply {
                addView(collectionItem("복습우선", "${reviewCount}개", R.drawable.ic_lucide_star_active, Theme.Orange) { navigate(Screen.Review) }, ui.weighted())
                addView(collectionItem("게시글", "저장글", R.drawable.ic_lucide_message_circle, 0xFF6366F1.toInt()) { navigate(Screen.Community) }, ui.weighted())
            })
        }
    }

    private fun collectionItem(title: String, detail: String, iconRes: Int, color: Int, action: () -> Unit): View {
        return ui.vertical().apply {
            setPadding(ui.dp(14), ui.dp(14), ui.dp(14), ui.dp(14))
            background = ui.rounded(Theme.Card, 16, Theme.Border)
            setOnClickListener { action() }
            addView(FrameLayout(activity).apply {
                background = ui.rounded(color, 10)
                addView(tintedIcon(iconRes, Theme.Card, 18), FrameLayout.LayoutParams(ui.dp(18), ui.dp(18), Gravity.CENTER))
            }, LinearLayout.LayoutParams(ui.dp(36), ui.dp(36)))
            addView(ui.text(title, 15, Theme.Text, true).apply {
                setPadding(0, ui.dp(8), 0, 0)
            })
            addView(ui.text(detail, 12, Theme.Muted))
        }
    }

    private fun headerStat(value: String, label: String): View {
        return ui.vertical().apply {
            addView(ui.text(value, 24, Theme.Card, true))
            addView(ui.text(label, 13, 0xCCFFFFFF.toInt()))
        }
    }

    private fun studyButtons(): View {
        return ui.horizontal().apply {
            addView(studyButton("플래시카드", "즐겨찾기 단어 학습", Theme.Primary, R.drawable.ic_lucide_zap) {
                navigate(Screen.Flashcard)
            }, ui.weighted())
            addView(studyButton("문장 학습", "문장으로 익히기", Theme.Blue, R.drawable.ic_lucide_book_open) {
                navigate(Screen.SentenceQuiz)
            }, ui.weighted())
        }
    }

    private fun studyButton(title: String, subtitle: String, color: Int, iconRes: Int, action: () -> Unit): View {
        return ui.vertical().apply {
            setPadding(ui.dp(16), ui.dp(16), ui.dp(16), ui.dp(16))
            background = ui.rounded(color, 16)
            setOnClickListener { action() }
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(FrameLayout(activity).apply {
                    background = ui.rounded(0x33FFFFFF, 12)
                    addView(ImageView(activity).apply {
                        setImageResource(iconRes)
                        setColorFilter(Theme.Card)
                    }, FrameLayout.LayoutParams(ui.dp(22), ui.dp(22), Gravity.CENTER))
                }, LinearLayout.LayoutParams(ui.dp(40), ui.dp(40)).apply {
                    setMargins(0, 0, ui.dp(10), 0)
                })
                addView(ui.text(title, 17, Theme.Card, true))
            })
            addView(ui.text(subtitle, 13, 0xCCFFFFFF.toInt()).apply {
                setPadding(0, ui.dp(6), 0, 0)
            })
        }
    }

    private fun emptyFavorites(): View {
        return ui.vertical().apply {
            gravity = Gravity.CENTER
            setPadding(0, ui.dp(80), 0, ui.dp(80))
            addView(tintedIcon(R.drawable.ic_lucide_star, Theme.Muted, 56).apply { setPadding(0, 0, 0, ui.dp(8)) })
            addView(ui.text("즐겨찾기가 비어있습니다", 22, Theme.Text, true).apply { gravity = Gravity.CENTER })
            addView(ui.text(emptyMessage, 16, Theme.Muted).apply { gravity = Gravity.CENTER })
        }
    }

    private fun tipsCard(): View {
        return ui.card().apply {
            setPadding(ui.dp(18), ui.dp(18), ui.dp(18), ui.dp(18))
            background = ui.rounded(Theme.Accent, 16, Theme.Border)
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(tintedIcon(R.drawable.ic_lucide_star_active, Theme.Yellow, 18))
                addView(ui.text("즐겨찾기 활용 팁", 17, Theme.Text, true).apply {
                    setPadding(ui.dp(8), 0, 0, 0)
                })
            })
            addView(ui.text("자주 헷갈리는 단어를 추가하고, 시험 전 빠르게 복습하세요.", 14, Theme.Muted).apply {
                setPadding(0, ui.dp(8), 0, 0)
            })
        }
    }

    private fun savedPostsSection(): View {
        val holder = ui.vertical().apply {
            addView(ui.text("저장한 게시글", 20, Theme.Text, true).apply {
                setPadding(0, ui.dp(18), 0, ui.dp(10))
            })
            addView(ui.text("저장한 커뮤니티 글을 불러오는 중입니다.", 14, Theme.Muted))
        }

        val repo = communityRepository
        val uid = userId
        if (repo == null || uid.isNullOrBlank() || uid == "anonymous") {
            holder.removeAllViews()
            holder.addView(ui.text("저장한 게시글", 20, Theme.Text, true).apply {
                setPadding(0, ui.dp(18), 0, ui.dp(10))
            })
            holder.addView(emptyMini("로그인하면 저장한 게시글도 함께 모아볼 수 있습니다."))
            return holder
        }

        repo.loadBookmarkedPosts(uid) { result ->
            activity.runOnUiThread {
                holder.removeAllViews()
                holder.addView(ui.text("저장한 게시글", 20, Theme.Text, true).apply {
                    setPadding(0, ui.dp(18), 0, ui.dp(10))
                })
                result
                    .onSuccess { posts ->
                        if (posts.isEmpty()) {
                            holder.addView(emptyMini("저장한 게시글이 없습니다."))
                        } else {
                            posts.take(2).forEach { holder.addView(postPreviewCard(it)) }
                        }
                    }
                    .onFailure { holder.addView(emptyMini("저장한 게시글을 불러오지 못했습니다.")) }
            }
        }
        return holder
    }

    private fun postPreviewCard(post: CommunityPost): View {
        return ui.card().apply {
            setOnClickListener { navigate(Screen.PostDetail(post.id)) }
            addView(ui.text(post.categoryName, 12, Theme.Primary, true))
            addView(ui.text(post.title, 17, Theme.Text, true).apply {
                setPadding(0, ui.dp(6), 0, ui.dp(4))
            })
            addView(ui.text(post.content, 13, Theme.Muted))
            addView(ui.text("${post.authorName} · 좋아요 ${post.likes} · 댓글 ${post.comments}", 12, Theme.Muted).apply {
                setPadding(0, ui.dp(8), 0, 0)
            })
        }
    }

    private fun emptyMini(message: String): View {
        return ui.vertical().apply {
            setPadding(ui.dp(14), ui.dp(14), ui.dp(14), ui.dp(14))
            background = ui.rounded(Theme.Card, 14, Theme.Border)
            addView(ui.text(message, 14, Theme.Muted))
        }
    }

    private fun wordCard(word: Word): View {
        return ui.card().apply {
            setOnClickListener { navigate(Screen.WordDetail(word.index)) }
            addView(ui.horizontal().apply {
                addView(ui.vertical().apply {
                    addView(ui.horizontal().apply {
                        if (store.isFavorite(word)) {
                            addView(tintedIcon(R.drawable.ic_lucide_star_active, Theme.Yellow, 18), LinearLayout.LayoutParams(ui.dp(18), ui.dp(18)).apply {
                                setMargins(0, 0, ui.dp(8), 0)
                            })
                        }
                        addView(ui.text(word.word, 20, Theme.Text, true))
                    })
                    addView(ui.text(word.meaning, 15, Theme.Muted).apply {
                        setPadding(0, ui.dp(4), 0, ui.dp(10))
                    })
                    addView(ui.horizontal().apply {
                        gravity = Gravity.CENTER_VERTICAL
                        addView(ui.text(word.level, 12, Theme.Muted, true).apply {
                            setPadding(ui.dp(10), ui.dp(4), ui.dp(10), ui.dp(4))
                            background = ui.rounded(Theme.Card, 10, Theme.Border)
                        })
                        addView(progress(mastery(word)), LinearLayout.LayoutParams(0, ui.dp(7), 1f).apply {
                            setMargins(ui.dp(12), 0, ui.dp(8), 0)
                        })
                        addView(ui.text("${mastery(word)}%", 12, Theme.Muted))
                    })
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(tintedIcon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
            })
        }
    }

    private fun progress(value: Int): View {
        val frame = FrameLayout(activity).apply {
            background = ui.rounded(Theme.Card, 4, Theme.Border)
        }
        val bar = View(activity).apply { background = ui.rounded(if (title == "즐겨찾기") Theme.Yellow else Theme.Primary, 4) }
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
