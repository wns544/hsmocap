package com.hsmocap.app.screens

import android.app.Activity
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.drawable.RippleDrawable
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.hsmocap.app.R
import com.hsmocap.app.data.CommunityPost
import com.hsmocap.app.data.CommunityRepository
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.Word
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.RemoteImageView
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class CommunityScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val words: List<Word>,
    private val store: StudyStore,
    private val communityRepository: CommunityRepository,
    private val canWrite: Boolean,
    private val onRequireLogin: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    private var postLimit: Long = PAGE_SIZE
    private var query: String = ""
    private var activeCategoryId: String = "all"
    private var loadedPosts: List<CommunityPost> = emptyList()
    private var body: LinearLayout? = null
    private val categoryChipViews = mutableMapOf<String, TextView>()

    fun view(): View {
        return scrollWithContent { box ->
            box.addView(header())
            body = ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
            }
            val contentBody = requireNotNull(body)
            contentBody.addView(ui.text("게시글을 불러오는 중입니다.", 15, Theme.Muted).apply {
                gravity = Gravity.CENTER
                setPadding(0, ui.dp(18), 0, ui.dp(18))
            })
            loadPosts(contentBody)
            contentBody.addView(certificationCard())
            contentBody.addView(section("오늘의 추천 단어"))
            recommendedWords().forEach { contentBody.addView(wordCard(it)) }
            box.addView(contentBody)
        }
    }

    private fun header(): View {
        return ui.vertical().apply {
            categoryChipViews.clear()
            setPadding(ui.dp(24), ui.dp(44), ui.dp(24), ui.dp(18))
            setBackgroundColor(Theme.Card)
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.text("커뮤니티", 26, Theme.Text, true), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.horizontal().apply {
                    gravity = Gravity.CENTER
                    setPadding(ui.dp(14), ui.dp(8), ui.dp(14), ui.dp(8))
                    background = ui.rounded(Theme.Primary, 18)
                    setOnClickListener {
                        if (canWrite) navigate(Screen.CreatePost) else onRequireLogin()
                    }
                    addView(tintedIcon(R.drawable.ic_lucide_edit, Theme.Card, 16))
                    addView(ui.text("글쓰기", 14, Theme.Card, true).apply {
                        setPadding(ui.dp(6), 0, 0, 0)
                    })
                })
            })
            addView(EditText(activity).apply {
                hint = "궁금한 내용을 검색해보세요"
                setSingleLine(true)
                textSize = 14f
                setTextColor(Theme.Text)
                setHintTextColor(Theme.Muted)
                setPadding(ui.dp(16), 0, ui.dp(16), 0)
                background = ui.rounded(Theme.MutedBackground, 14)
                addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
                    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                        query = s?.toString().orEmpty()
                        body?.let { renderPosts(it) }
                    }
                    override fun afterTextChanged(s: Editable?) = Unit
                })
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(54)).apply {
                setMargins(0, ui.dp(16), 0, 0)
            })
            addView(HorizontalScrollView(activity).apply {
                isHorizontalScrollBarEnabled = false
                overScrollMode = View.OVER_SCROLL_NEVER
                setPadding(0, ui.dp(12), 0, 0)
                clipToPadding = false
                addView(ui.horizontal().apply {
                    communityCategories.forEach { category ->
                        val style = categoryStyle(category.id)
                        addView(ui.text(category.name, 13, Theme.Text, true).apply {
                            gravity = Gravity.CENTER
                            includeFontPadding = false
                            setSingleLine(false)
                            setPadding(ui.dp(13), ui.dp(8), ui.dp(13), ui.dp(8))
                            isClickable = true
                            categoryChipViews[category.id] = this
                            applyCategoryChipStyle(this, category.id)
                            setOnClickListener {
                                activeCategoryId = category.id
                                updateCategoryChips()
                                body?.let { renderPosts(it) }
                            }
                        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ui.dp(36)).apply {
                            setMargins(0, 0, ui.dp(8), 0)
                        })
                    }
                }, ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                ))
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }
    }

    private fun updateCategoryChips() {
        communityCategories.forEach { category ->
            categoryChipViews[category.id]?.let { chip ->
                applyCategoryChipStyle(chip, category.id)
            }
        }
    }

    private fun applyCategoryChipStyle(chip: TextView, categoryId: String) {
        val selected = activeCategoryId == categoryId
        val style = categoryStyle(categoryId)
        chip.setTextColor(if (selected) Theme.Card else style.text)
        chip.background = ui.rounded(if (selected) style.color else style.background, 16, style.border)
        chip.foreground = RippleDrawable(
            ColorStateList.valueOf(if (selected) 0x55FFFFFF else 0x22000000),
            null,
            ui.rounded(0xFFFFFFFF.toInt(), 16),
        )
    }

    private fun certificationCard(): View {
        return ui.card().apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(20), 0, ui.dp(8))
            }
            addView(ui.text("오늘의 학습 인증", 20, Theme.Text, true))
            addView(ui.text(certificationText(), 15, Theme.Muted))
            addView(ui.button("인증 내용 공유", Theme.Primary, Theme.Card).apply {
                setOnClickListener { shareCertification() }
            })
        }
    }

    private fun loadPosts(body: LinearLayout) {
        communityRepository.loadPosts(postLimit) { result ->
            activity.runOnUiThread {
                body.removeAllViews()
                result
                    .onSuccess { posts ->
                        loadedPosts = posts
                        renderPosts(body)
                    }
                    .onFailure { error -> body.addView(errorCard(error.localizedMessage ?: "게시글을 불러오지 못했습니다.")) }
            }
        }
    }

    private fun renderPosts(body: LinearLayout) {
        body.removeAllViews()
        val filtered = loadedPosts.filter { post ->
            val matchesCategory = activeCategoryId == "all" || post.categoryId == activeCategoryId
            val keyword = query.trim().lowercase()
            val matchesQuery = keyword.isEmpty() ||
                post.title.lowercase().contains(keyword) ||
                post.content.lowercase().contains(keyword) ||
                post.authorName.lowercase().contains(keyword)
            matchesCategory && matchesQuery
        }
        if (filtered.isEmpty()) {
            body.addView(emptyPosts())
        } else {
            filtered.forEach { body.addView(postCard(it)) }
            if (loadedPosts.size.toLong() >= postLimit) {
                body.addView(loadMoreButton(body))
            }
        }
        body.addView(certificationCard())
        body.addView(section("오늘의 추천 단어"))
        recommendedWords().forEach { body.addView(wordCard(it)) }
    }

    private fun loadMoreButton(body: LinearLayout): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER
            setPadding(0, ui.dp(18), 0, ui.dp(18))
            background = ui.rounded(Theme.Card, 24, Theme.Border)
            addView(ui.text("더 보기", 16, Theme.Primary, true))
            addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Primary, 18), LinearLayout.LayoutParams(ui.dp(22), ui.dp(22)))
            setOnClickListener {
                postLimit += PAGE_SIZE
                body.removeAllViews()
                body.addView(ui.text("게시글을 더 불러오는 중입니다.", 15, Theme.Muted).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(18), 0, ui.dp(18))
                })
                loadPosts(body)
            }
        }
    }

    private fun postCard(post: CommunityPost): View {
        return ui.card().apply {
            background = ui.rounded(Theme.Card, 16, 0x10000000)
            elevation = ui.dp(1).toFloat()
            setOnClickListener { navigate(Screen.PostDetail(post.id)) }
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.text(post.authorAvatar, 18, Theme.Text, true).apply {
                    gravity = Gravity.CENTER
                    background = ui.rounded(0xFFECFDF5.toInt(), 20)
                }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)).apply {
                    setMargins(0, 0, ui.dp(12), 0)
                })
                addView(ui.vertical().apply {
                    addView(ui.horizontal().apply {
                        addView(ui.text(post.authorName, 14, Theme.Text, true))
                        addView(ui.text(post.authorLevel, 11, Theme.Muted, true).apply {
                            setPadding(ui.dp(8), ui.dp(2), ui.dp(8), ui.dp(2))
                            background = ui.rounded(0xFFECFDF5.toInt(), 10)
                        })
                    })
                    addView(ui.text(post.timestampLabel, 12, Theme.Muted))
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                if (post.isHot) {
                    addView(ui.text("HOT", 11, Theme.Orange, true).apply {
                        setPadding(ui.dp(8), ui.dp(4), ui.dp(8), ui.dp(4))
                        background = ui.rounded(0xFFFFF7ED.toInt(), 12)
                    })
                }
            })
            addView(ui.text(post.title, 18, Theme.Text, true).apply {
                setPadding(0, ui.dp(14), 0, ui.dp(6))
            })
            addView(ui.text(post.content, 14, Theme.Muted))
            post.imageUrl?.takeIf { it.isNotBlank() }?.let { imageUrl ->
                addView(RemoteImageView(activity, imageUrl, ui, 170).apply {
                    background = ui.rounded(Theme.Card, 16, Theme.Border)
                }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(170)).apply {
                    setMargins(0, ui.dp(14), 0, 0)
                })
            }
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, ui.dp(14), 0, 0)
                val style = categoryStyle(post.categoryId)
                addView(ui.text(categoryLabel(post), 12, style.text, true).apply {
                    gravity = Gravity.CENTER
                    minWidth = ui.dp(58)
                    setPadding(ui.dp(10), ui.dp(4), ui.dp(10), ui.dp(4))
                    background = ui.rounded(style.background, 12, style.border)
                }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))
                addView(View(activity), LinearLayout.LayoutParams(0, 1, 1f))
                addView(metric(R.drawable.ic_lucide_thumbs_up, post.likes))
                addView(metric(R.drawable.ic_lucide_message_circle, post.comments), LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                    setMargins(ui.dp(12), 0, 0, 0)
                })
            })
        }
    }

    private fun emptyPosts(): View {
        return ui.card().apply {
            gravity = Gravity.CENTER_HORIZONTAL
            addView(ui.text("아직 게시글이 없습니다.", 18, Theme.Text, true).apply { gravity = Gravity.CENTER })
            addView(ui.text("첫 글을 작성해 커뮤니티를 시작하세요.", 14, Theme.Muted).apply {
                gravity = Gravity.CENTER
                setPadding(0, ui.dp(6), 0, ui.dp(12))
            })
            addView(ui.button("글쓰기", Theme.Primary, Theme.Card).apply {
                setOnClickListener {
                    if (canWrite) navigate(Screen.CreatePost) else onRequireLogin()
                }
            })
        }
    }

    private fun errorCard(message: String): View {
        return ui.card().apply {
            addView(ui.text("커뮤니티 연결 필요", 18, Theme.Text, true))
            addView(ui.text(message, 14, Theme.Muted).apply {
                setPadding(0, ui.dp(6), 0, 0)
            })
        }
    }

    private fun statCard(value: String, label: String, color: Int): View {
        return ui.card().apply {
            gravity = Gravity.CENTER_HORIZONTAL
            addView(ui.text(value, 27, color, true).apply { gravity = Gravity.CENTER })
            addView(ui.text(label, 13, Theme.Muted).apply { gravity = Gravity.CENTER })
        }
    }

    private fun actionCard(title: String, subtitle: String, color: Int, action: () -> Unit): View {
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
                addView(tintedIcon(R.drawable.ic_lucide_book_open, Theme.Card, 20), FrameLayout.LayoutParams(ui.dp(20), ui.dp(20), Gravity.CENTER))
            }, LinearLayout.LayoutParams(ui.dp(42), ui.dp(42)))
            addView(ui.vertical().apply {
                setPadding(ui.dp(14), 0, 0, 0)
                addView(ui.text(title, 18, Theme.Text, true))
                addView(ui.text(subtitle, 14, Theme.Muted))
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
        }
    }

    private fun wordCard(word: Word): View {
        return ui.card().apply {
            setOnClickListener { navigate(Screen.WordDetail(word.index)) }
            addView(ui.horizontal().apply {
                addView(ui.vertical().apply {
                    addView(ui.text(word.word, 20, Theme.Text, true))
                    addView(ui.text(word.meaning, 15, Theme.Muted))
                    addView(ui.text(word.exampleSentence, 14, Theme.Muted))
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(ui.icon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20))
            })
        }
    }

    private fun section(label: String): View {
        return ui.text(label, 22, Theme.Text, true).apply {
            setPadding(0, ui.dp(24), 0, ui.dp(12))
        }
    }

    private fun recommendedWords(): List<Word> {
        val priorityIds = store.wrongAnswerIds() + store.favoriteIds()
        val priorityWords = priorityIds.mapNotNull { id -> words.firstOrNull { it.index == id } }
        return (priorityWords + words).distinctBy { it.index }.take(3)
    }

    private fun certificationText(): String {
        return "오늘 ${store.todayAnswered()}개 풀이 · 정답률 ${store.accuracyPercent()}% · ${store.streakDays()}일 연속 학습"
    }

    private fun shareCertification() {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "HSMOCAP 단어학습 인증\n${certificationText()}")
        }
        activity.startActivity(Intent.createChooser(intent, "학습 인증 공유"))
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    private fun metric(iconRes: Int, count: Int): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            addView(tintedIcon(iconRes, Theme.Muted, 15))
            addView(ui.text("$count", 13, Theme.Muted).apply {
                setPadding(ui.dp(4), 0, 0, 0)
            })
        }
    }

    private fun categoryLabel(post: CommunityPost): String {
        return when (post.categoryId) {
            "study-tip" -> "학습팁"
            "word-compare" -> "단어비교"
            "sentence-practice" -> "문장학습"
            "exam-prep" -> "시험준비"
            "resources" -> "자료공유"
            "question" -> "질문"
            "review" -> "후기"
            else -> post.categoryName.ifBlank { post.category }
        }
    }

    private fun tintedIcon(iconRes: Int, color: Int, sizeDp: Int): ImageView {
        return ImageView(activity).apply {
            setImageResource(iconRes)
            imageTintList = ColorStateList.valueOf(color)
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(ui.dp(sizeDp), ui.dp(sizeDp))
        }
    }

    companion object {
        private const val PAGE_SIZE = 5L
        private val communityCategories = listOf(
            CommunityCategory("all", "전체"),
            CommunityCategory("study-tip", "학습팁"),
            CommunityCategory("word-compare", "단어비교"),
            CommunityCategory("sentence-practice", "문장학습"),
            CommunityCategory("exam-prep", "시험준비"),
            CommunityCategory("resources", "자료공유"),
            CommunityCategory("question", "질문"),
            CommunityCategory("review", "후기"),
        )
    }
}

private data class CommunityCategory(val id: String, val name: String)

private data class CategoryStyle(val color: Int, val background: Int, val border: Int, val text: Int)

private fun categoryStyle(categoryId: String): CategoryStyle {
    return when (categoryId) {
        "study-tip" -> CategoryStyle(0xFFF59E0B.toInt(), 0xFFFFFBEB.toInt(), 0xFFFCD34D.toInt(), 0xFFB45309.toInt())
        "word-compare" -> CategoryStyle(0xFF8B5CF6.toInt(), 0xFFF5F3FF.toInt(), 0xFFC4B5FD.toInt(), 0xFF6D28D9.toInt())
        "sentence-practice" -> CategoryStyle(0xFF0EA5E9.toInt(), 0xFFF0F9FF.toInt(), 0xFF7DD3FC.toInt(), 0xFF0369A1.toInt())
        "exam-prep" -> CategoryStyle(0xFFF43F5E.toInt(), 0xFFFFF1F2.toInt(), 0xFFFDA4AF.toInt(), 0xFFBE123C.toInt())
        "resources" -> CategoryStyle(0xFF10B981.toInt(), 0xFFECFDF5.toInt(), 0xFF6EE7B7.toInt(), 0xFF047857.toInt())
        "question" -> CategoryStyle(0xFF3B82F6.toInt(), 0xFFEFF6FF.toInt(), 0xFF93C5FD.toInt(), 0xFF1D4ED8.toInt())
        "review" -> CategoryStyle(0xFFF97316.toInt(), 0xFFFFF7ED.toInt(), 0xFFFDBA74.toInt(), 0xFFC2410C.toInt())
        else -> CategoryStyle(Theme.Primary, Theme.Card, Theme.Border, Theme.Primary)
    }
}
