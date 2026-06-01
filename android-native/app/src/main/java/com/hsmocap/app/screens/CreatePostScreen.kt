package com.hsmocap.app.screens

import android.app.Activity
import android.net.Uri
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Toast
import com.hsmocap.app.R
import com.hsmocap.app.data.CommunityAuthor
import com.hsmocap.app.data.CommunityRepository
import com.hsmocap.app.data.ImageUploadRepository
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class CreatePostScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val communityRepository: CommunityRepository,
    private val imageUploadRepository: ImageUploadRepository,
    private val author: CommunityAuthor,
    private val selectedImageUri: Uri?,
    private val onPickImage: () -> Unit,
    private val onClearImage: () -> Unit,
    private val onPostCreated: () -> Unit,
    private val canSubmit: Boolean,
    private val onRequireLogin: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        if (!canSubmit) {
            return lockedView()
        }

        val titleInput = input("제목")
        val categoryInput = input("카테고리").apply { setText("학습팁") }
        val contentInput = input("내용을 입력하세요").apply {
            setSingleLine(false)
            minLines = 8
            gravity = Gravity.TOP
            setPadding(ui.dp(16), ui.dp(14), ui.dp(16), ui.dp(14))
        }

        return ui.vertical().apply {
            addView(header(titleInput, categoryInput, contentInput))
            addView(ScrollView(activity).apply {
                addView(ui.vertical().apply {
                    setPadding(ui.dp(24), ui.dp(24), ui.dp(24), ui.dp(24))
                    addView(label("제목"))
                    addView(titleInput, fieldParams())
                    addView(label("카테고리"))
                    addView(ui.text("학습팁, 단어비교, 문장학습, 시험준비, 자료공유, 질문, 후기 중 하나로 작성하면 라이브 웹과 같은 게시판 색상이 적용됩니다.", 12, Theme.Muted))
                    addView(categoryInput, fieldParams())
                    addView(label("이미지"))
                    addView(imagePicker())
                    addView(label("내용"))
                    addView(contentInput, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(220)).apply {
                        setMargins(0, ui.dp(8), 0, ui.dp(16))
                    })
                })
            })
        }
    }

    private fun lockedView(): View {
        return ui.vertical().apply {
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(ui.dp(18), ui.dp(44), ui.dp(18), ui.dp(12))
                setBackgroundColor(Theme.Card)
                addView(ui.icon(R.drawable.ic_lucide_chevron_left, Theme.Text, 26).apply {
                    setOnClickListener { navigate(Screen.Community) }
                }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
                addView(ui.text("글쓰기", 18, Theme.Text, false), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
            addView(ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(32), ui.dp(24), ui.dp(24))
                addView(ui.card().apply {
                    addView(ui.text("로그인이 필요합니다", 20, Theme.Text, true))
                    addView(ui.text("커뮤니티 글쓰기는 로그인 후 사용할 수 있습니다.", 15, Theme.Muted).apply {
                        setPadding(0, ui.dp(8), 0, ui.dp(12))
                    })
                    addView(ui.button("로그인하기", Theme.Primary, Theme.Card).apply {
                        setOnClickListener { onRequireLogin() }
                    })
                })
            })
        }
    }

    private fun header(titleInput: EditText, categoryInput: EditText, contentInput: EditText): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(18), ui.dp(44), ui.dp(18), ui.dp(12))
            setBackgroundColor(Theme.Card)
            addView(ui.icon(R.drawable.ic_lucide_chevron_left, Theme.Text, 26).apply {
                setOnClickListener { navigate(Screen.Community) }
            }, LinearLayout.LayoutParams(ui.dp(44), ui.dp(44)))
            addView(ui.text("글쓰기", 18, Theme.Text, false), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(ui.text("게시", 14, Theme.Card, true).apply {
                gravity = Gravity.CENTER
                setPadding(ui.dp(14), ui.dp(8), ui.dp(14), ui.dp(8))
                background = ui.rounded(Theme.Primary, 18)
                setOnClickListener {
                    publish(titleInput, categoryInput, contentInput)
                }
            })
        }
    }

    private fun imagePicker(): View {
        return ui.vertical().apply {
            setPadding(ui.dp(16), ui.dp(14), ui.dp(16), ui.dp(14))
            background = ui.rounded(Theme.Card, 16, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(8), 0, ui.dp(8))
            }
            addView(ui.text(
                selectedImageUri?.lastPathSegment?.let { "선택됨: $it" } ?: "선택된 이미지가 없습니다.",
                14,
                Theme.Muted,
            ))
            addView(ui.horizontal().apply {
                setPadding(0, ui.dp(10), 0, 0)
                addView(ui.button("이미지 선택", Theme.Primary, Theme.Card).apply {
                    setOnClickListener { onPickImage() }
                }, LinearLayout.LayoutParams(0, ui.dp(48), 1f).apply {
                    setMargins(0, 0, ui.dp(8), 0)
                })
                addView(ui.button("삭제", Theme.Card, 0xFFDC2626.toInt()).apply {
                    isEnabled = selectedImageUri != null
                    alpha = if (selectedImageUri != null) 1f else 0.45f
                    setOnClickListener {
                        if (selectedImageUri != null) onClearImage()
                    }
                }, LinearLayout.LayoutParams(0, ui.dp(48), 1f))
            })
        }
    }

    private fun publish(titleInput: EditText, categoryInput: EditText, contentInput: EditText) {
        val title = titleInput.text.toString()
        val category = categoryInput.text.toString()
        val content = contentInput.text.toString()
        val imageUri = selectedImageUri

        if (imageUri == null) {
            createPost(title, category, content, imageUrl = null)
            return
        }

        Toast.makeText(activity, "이미지를 업로드하는 중입니다.", Toast.LENGTH_SHORT).show()
        imageUploadRepository.uploadCommunityImage(author.id, imageUri) { result ->
            activity.runOnUiThread {
                result
                    .onSuccess { imageUrl -> createPost(title, category, content, imageUrl) }
                    .onFailure {
                        Toast.makeText(activity, "이미지 첨부 없이 게시를 계속합니다.", Toast.LENGTH_SHORT).show()
                        createPost(title, category, content, imageUrl = null)
                    }
            }
        }
    }

    private fun createPost(title: String, category: String, content: String, imageUrl: String?) {
        communityRepository.addPost(
            author = author,
            title = title,
            content = content,
            category = category,
            imageUrl = imageUrl,
        ) { result ->
            activity.runOnUiThread {
                result
                    .onSuccess { postId ->
                        onPostCreated()
                        navigate(Screen.PostDetail(postId))
                    }
                    .onFailure {
                        Toast.makeText(activity, "게시 권한을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.", Toast.LENGTH_LONG).show()
                    }
            }
        }
    }
    private fun input(hintValue: String): EditText {
        return EditText(activity).apply {
            hint = hintValue
            textSize = 15f
            setTextColor(Theme.Text)
            setHintTextColor(Theme.Muted)
            setPadding(ui.dp(16), 0, ui.dp(16), 0)
            background = ui.rounded(Theme.Card, 16, Theme.Border)
        }
    }

    private fun label(value: String): View {
        return ui.text(value, 14, Theme.Muted, true).apply {
            setPadding(0, ui.dp(12), 0, 0)
        }
    }

    private fun fieldParams(): LinearLayout.LayoutParams {
        return LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(56)).apply {
            setMargins(0, ui.dp(8), 0, ui.dp(8))
        }
    }
}
