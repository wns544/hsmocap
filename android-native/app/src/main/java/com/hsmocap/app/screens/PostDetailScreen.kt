package com.hsmocap.app.screens

import android.app.Activity
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Toast
import com.hsmocap.app.data.CommunityAuthor
import com.hsmocap.app.data.CommunityComment
import com.hsmocap.app.data.CommunityPost
import com.hsmocap.app.data.CommunityReaction
import com.hsmocap.app.data.CommunityRepository
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.RemoteImageView
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class PostDetailScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val postId: String,
    private val communityRepository: CommunityRepository,
    private val author: CommunityAuthor,
    private val canComment: Boolean,
    private val onRequireLogin: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    private lateinit var content: LinearLayout

    fun view(): View {
        return ui.vertical().apply {
            addView(header(), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            addView(ScrollView(activity).apply {
                content = ui.vertical().apply {
                    setPadding(0, 0, 0, ui.dp(12))
                    addView(ui.text("게시글을 불러오는 중입니다.", 15, Theme.Muted).apply {
                        gravity = Gravity.CENTER
                        setPadding(ui.dp(24), ui.dp(32), ui.dp(24), ui.dp(32))
                    })
                }
                addView(content)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            addView(commentInput(), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            load()
        }
    }

    private fun load() {
        communityRepository.loadPost(postId) { postResult ->
            activity.runOnUiThread {
                postResult
                    .onSuccess { post ->
                        communityRepository.recordView(postId, author.id) { }
                        loadReactionThenRender(post)
                    }
                    .onFailure { error ->
                        content.removeAllViews()
                        content.addView(errorCard(error.localizedMessage ?: "게시글을 불러오지 못했습니다."))
                    }
            }
        }
    }

    private fun loadReactionThenRender(post: CommunityPost) {
        if (!canComment) {
            renderPost(post, CommunityReaction(liked = false, bookmarked = false))
            return
        }
        communityRepository.loadReaction(post.id, author.id) { result ->
            activity.runOnUiThread {
                renderPost(post, result.getOrDefault(CommunityReaction(liked = false, bookmarked = false)))
            }
        }
    }

    private fun renderPost(post: CommunityPost, reaction: CommunityReaction) {
        content.removeAllViews()
        content.addView(postBody(post))
        content.addView(actionBar(post, reaction))
        content.addView(commentsLoading())
        loadComments()
    }

    private fun loadComments() {
        communityRepository.loadComments(postId) { result ->
            activity.runOnUiThread {
                if (content.childCount >= 3) content.removeViewAt(2)
                result
                    .onSuccess { comments -> content.addView(comments(comments), 2) }
                    .onFailure { error -> content.addView(errorCard(error.localizedMessage ?: "댓글을 불러오지 못했습니다."), 2) }
            }
        }
    }

    private fun header(): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(18), ui.dp(44), ui.dp(18), ui.dp(12))
            setBackgroundColor(Theme.Card)
            addView(ui.text("‹", 32, Theme.Text, false).apply {
                gravity = Gravity.CENTER
                setOnClickListener { navigate(Screen.Community) }
            }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
            addView(View(activity), LinearLayout.LayoutParams(0, 1, 1f))
            addView(ui.text("공유", 14, Theme.Muted, true).apply { gravity = Gravity.CENTER }, LinearLayout.LayoutParams(ui.dp(48), ui.dp(40)))
            addView(ui.text("⋮", 24, Theme.Muted, true).apply { gravity = Gravity.CENTER }, LinearLayout.LayoutParams(ui.dp(40), ui.dp(40)))
        }
    }

    private fun postBody(post: CommunityPost): View {
        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
            setBackgroundColor(Theme.Card)
            addView(ui.text(post.category, 12, Theme.Primary, true).apply {
                setPadding(ui.dp(8), ui.dp(3), ui.dp(8), ui.dp(3))
                background = ui.rounded(Theme.Card, 12, 0x5510B981)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, ui.dp(14))
            })
            addView(ui.text(post.title, 24, Theme.Text, false).apply {
                setPadding(0, 0, 0, ui.dp(16))
            })
            addView(authorRow(post), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, ui.dp(22))
            })
            addView(ui.text(post.content, 16, Theme.Text).apply {
                setLineSpacing(ui.dp(5).toFloat(), 1f)
                setPadding(0, 0, 0, ui.dp(22))
            })
            post.imageUrl?.takeIf { it.isNotBlank() }?.let { imageUrl ->
                addView(RemoteImageView(activity, imageUrl, ui, 260).apply {
                    background = ui.rounded(Theme.Card, 18, Theme.Border)
                }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(260)).apply {
                    setMargins(0, 0, 0, ui.dp(22))
                })
            }
            addView(ui.text("조회 ${post.views}   좋아요 ${post.likes}   댓글 ${post.comments}   저장 ${post.bookmarks}", 14, Theme.Muted).apply {
                setPadding(0, ui.dp(16), 0, 0)
            })
        }
    }

    private fun authorRow(post: CommunityPost): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            addView(ui.text(post.authorAvatar, 22, Theme.Text, true).apply {
                gravity = Gravity.CENTER
                background = ui.rounded(Theme.Card, 24, Theme.Border)
            }, LinearLayout.LayoutParams(ui.dp(48), ui.dp(48)).apply {
                setMargins(0, 0, ui.dp(12), 0)
            })
            addView(ui.vertical().apply {
                addView(ui.horizontal().apply {
                    gravity = Gravity.CENTER_VERTICAL
                    addView(ui.text(post.authorName, 15, Theme.Text, false))
                    addView(ui.text(post.authorLevel, 11, Theme.Muted, true).apply {
                        setPadding(ui.dp(8), ui.dp(2), ui.dp(8), ui.dp(2))
                        background = ui.rounded(Theme.Card, 10, Theme.Border)
                    })
                })
                addView(ui.text(post.timestampLabel, 13, Theme.Muted))
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
    }

    private fun actionBar(post: CommunityPost, reaction: CommunityReaction): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER
            setPadding(ui.dp(24), ui.dp(22), ui.dp(24), ui.dp(22))
            setBackgroundColor(Theme.Card)
            addView(action(ReactionIcon.Like, "좋아요", reaction.liked) {
                if (!canComment) {
                    onRequireLogin()
                } else {
                    communityRepository.toggleLike(post.id, author.id) { result ->
                        activity.runOnUiThread {
                            result
                                .onSuccess {
                                    load()
                                }
                                .onFailure { error ->
                                    Toast.makeText(activity, error.localizedMessage ?: "좋아요 반영에 실패했습니다.", Toast.LENGTH_SHORT).show()
                                }
                        }
                    }
                }
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(action(ReactionIcon.Comment, "댓글", false) {
                Toast.makeText(activity, "아래 입력창에서 댓글을 작성하세요.", Toast.LENGTH_SHORT).show()
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(action(ReactionIcon.Bookmark, "저장", reaction.bookmarked) {
                if (!canComment) {
                    onRequireLogin()
                } else {
                    communityRepository.toggleBookmark(post.id, author.id) { result ->
                        activity.runOnUiThread {
                            result
                                .onSuccess { load() }
                                .onFailure { error ->
                                    Toast.makeText(activity, error.localizedMessage ?: "저장에 실패했습니다.", Toast.LENGTH_SHORT).show()
                                }
                        }
                    }
                }
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
    }

    private fun action(icon: ReactionIcon, label: String, active: Boolean, onClick: () -> Unit): View {
        return ui.vertical().apply {
            gravity = Gravity.CENTER
            setOnClickListener { onClick() }
            addView(ReactionIconView(activity, ui, icon, active), LinearLayout.LayoutParams(ui.dp(58), ui.dp(58)))
            addView(ui.text(label, 12, Theme.Text).apply {
                gravity = Gravity.CENTER
                setPadding(0, ui.dp(6), 0, 0)
            })
        }
    }

    private fun commentsLoading(): View {
        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
            setBackgroundColor(Theme.Card)
            addView(ui.text("댓글을 불러오는 중입니다.", 15, Theme.Muted))
        }
    }

    private fun comments(comments: List<CommunityComment>): View {
        return ui.vertical().apply {
            setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
            setBackgroundColor(Theme.Card)
            addView(ui.text("댓글 ${comments.size}", 18, Theme.Text, false).apply {
                setPadding(0, 0, 0, ui.dp(16))
            })
            if (comments.isEmpty()) {
                addView(ui.text("아직 댓글이 없습니다.", 14, Theme.Muted))
            } else {
                comments.forEach { addView(commentRow(it)) }
            }
        }
    }

    private fun commentRow(comment: CommunityComment): View {
        return ui.horizontal().apply {
            setPadding(0, 0, 0, ui.dp(18))
            addView(ui.text(comment.authorAvatar, 18, Theme.Text, true).apply {
                gravity = Gravity.CENTER
                background = ui.rounded(Theme.Card, 20, Theme.Border)
            }, LinearLayout.LayoutParams(ui.dp(40), ui.dp(40)).apply {
                setMargins(0, 0, ui.dp(12), 0)
            })
            addView(ui.vertical().apply {
                addView(ui.horizontal().apply {
                    gravity = Gravity.CENTER_VERTICAL
                    addView(ui.text(comment.authorName, 14, Theme.Text, false))
                    addView(ui.text(comment.authorLevel, 11, Theme.Muted, true).apply {
                        setPadding(ui.dp(8), ui.dp(2), ui.dp(8), ui.dp(2))
                        background = ui.rounded(Theme.Card, 10, Theme.Border)
                    })
                })
                addView(ui.text(comment.content, 14, Theme.Text).apply {
                    setPadding(0, ui.dp(4), 0, ui.dp(8))
                })
                addView(ui.text("${comment.timestampLabel}   좋아요 ${comment.likes}   답글", 12, Theme.Muted))
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
    }

    private fun commentInput(): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(16), ui.dp(10), ui.dp(16), ui.dp(10))
            setBackgroundColor(Theme.Card)
            val input = EditText(activity).apply {
                hint = "댓글을 입력하세요"
                setSingleLine(true)
                textSize = 14f
                setTextColor(Theme.Text)
                setHintTextColor(Theme.Muted)
                setPadding(ui.dp(16), 0, ui.dp(16), 0)
                background = ui.rounded(Theme.Card, 22, Theme.Border)
            }
            addView(input, LinearLayout.LayoutParams(0, ui.dp(44), 1f).apply {
                setMargins(0, 0, ui.dp(10), 0)
            })
            addView(ui.text("➤", 18, Theme.Card, true).apply {
                gravity = Gravity.CENTER
                background = ui.rounded(Theme.Primary, 22)
                setOnClickListener {
                    if (!canComment) {
                        onRequireLogin()
                        return@setOnClickListener
                    }
                    val text = input.text.toString()
                    communityRepository.addComment(postId, author, text) { result ->
                        activity.runOnUiThread {
                            result
                                .onSuccess {
                                    input.text.clear()
                                    Toast.makeText(activity, "댓글이 등록되었습니다.", Toast.LENGTH_SHORT).show()
                                    load()
                                }
                                .onFailure { error ->
                                    Toast.makeText(activity, error.localizedMessage ?: "댓글 등록에 실패했습니다.", Toast.LENGTH_SHORT).show()
                                }
                        }
                    }
                }
            }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
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

    private enum class ReactionIcon {
        Like,
        Comment,
        Bookmark,
    }

    private class ReactionIconView(
        activity: Activity,
        private val ui: Ui,
        private val icon: ReactionIcon,
        private val active: Boolean,
    ) : View(activity) {
        private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
        }
        private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
            strokeWidth = ui.dp(2).toFloat()
        }
        private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textAlign = Paint.Align.CENTER
            textSize = ui.dp(22).toFloat()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val size = width.coerceAtMost(height).toFloat()
            val cx = width / 2f
            val cy = height / 2f
            val radius = size / 2f
            val activeColor = Theme.Primary
            val inactiveColor = Theme.Muted
            fillPaint.color = if (active) 0xFFE9FBF3.toInt() else Theme.Card
            canvas.drawCircle(cx, cy, radius, fillPaint)
            val iconColor = if (active) activeColor else inactiveColor
            strokePaint.color = iconColor
            textPaint.color = iconColor

            when (icon) {
                ReactionIcon.Like -> drawLike(canvas, cx, cy, active)
                ReactionIcon.Comment -> drawComment(canvas, cx, cy)
                ReactionIcon.Bookmark -> drawBookmark(canvas, cx, cy, active)
            }
        }

        private fun drawLike(canvas: Canvas, cx: Float, cy: Float, active: Boolean) {
            val path = Path().apply {
                moveTo(cx - ui.dp(11), cy + ui.dp(11))
                lineTo(cx - ui.dp(11), cy - ui.dp(1))
                quadTo(cx - ui.dp(11), cy - ui.dp(3), cx - ui.dp(9), cy - ui.dp(3))
                lineTo(cx - ui.dp(6), cy - ui.dp(3))
                lineTo(cx - ui.dp(1), cy - ui.dp(13))
                quadTo(cx, cy - ui.dp(15), cx + ui.dp(2), cy - ui.dp(15))
                quadTo(cx + ui.dp(5), cy - ui.dp(14), cx + ui.dp(4), cy - ui.dp(10))
                lineTo(cx + ui.dp(3), cy - ui.dp(5))
                lineTo(cx + ui.dp(11), cy - ui.dp(5))
                quadTo(cx + ui.dp(14), cy - ui.dp(5), cx + ui.dp(14), cy - ui.dp(2))
                quadTo(cx + ui.dp(14), cy, cx + ui.dp(13), cy + ui.dp(1))
                lineTo(cx + ui.dp(10), cy + ui.dp(10))
                quadTo(cx + ui.dp(9), cy + ui.dp(13), cx + ui.dp(6), cy + ui.dp(13))
                lineTo(cx - ui.dp(7), cy + ui.dp(13))
                quadTo(cx - ui.dp(11), cy + ui.dp(13), cx - ui.dp(11), cy + ui.dp(11))
                close()
            }
            if (active) {
                fillPaint.color = Theme.Primary
                canvas.drawPath(path, fillPaint)
            } else {
                canvas.drawPath(path, strokePaint)
            }
            if (!active) {
                canvas.drawLine(cx - ui.dp(6), cy - ui.dp(3), cx - ui.dp(6), cy + ui.dp(13), strokePaint)
            }
        }

        private fun drawComment(canvas: Canvas, cx: Float, cy: Float) {
            val rect = RectF(cx - ui.dp(12), cy - ui.dp(9), cx + ui.dp(12), cy + ui.dp(8))
            canvas.drawRoundRect(rect, ui.dp(9).toFloat(), ui.dp(9).toFloat(), strokePaint)
            val tail = Path().apply {
                moveTo(cx - ui.dp(3), cy + ui.dp(8))
                lineTo(cx - ui.dp(8), cy + ui.dp(13))
                lineTo(cx + ui.dp(3), cy + ui.dp(8))
            }
            canvas.drawPath(tail, strokePaint)
        }

        private fun drawBookmark(canvas: Canvas, cx: Float, cy: Float, active: Boolean) {
            val path = Path().apply {
                moveTo(cx - ui.dp(8), cy - ui.dp(12))
                lineTo(cx + ui.dp(8), cy - ui.dp(12))
                lineTo(cx + ui.dp(8), cy + ui.dp(12))
                lineTo(cx, cy + ui.dp(6))
                lineTo(cx - ui.dp(8), cy + ui.dp(12))
                close()
            }
            if (active) {
                fillPaint.color = Theme.Primary
                canvas.drawPath(path, fillPaint)
            } else {
                canvas.drawPath(path, strokePaint)
            }
        }
    }
}
