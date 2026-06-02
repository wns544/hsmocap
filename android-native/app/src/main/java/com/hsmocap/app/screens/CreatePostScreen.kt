package com.hsmocap.app.screens

import android.app.Activity
import android.app.Dialog
import android.net.Uri
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.Spinner
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
    private val selectedImageUris: List<Uri>,
    private val onPickImage: () -> Unit,
    private val onClearImage: () -> Unit,
    private val onPostCreated: () -> Unit,
    private val canSubmit: Boolean,
    private val onRequireLogin: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    private var publishingDialog: Dialog? = null
    private var publishing = false

    fun view(): View {
        if (!canSubmit) {
            return lockedView()
        }

        val titleInput = input("제목")
        val categoryInput = categoryDropdown()
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

    private fun header(titleInput: EditText, categoryInput: Spinner, contentInput: EditText): View {
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

    private fun categoryDropdown(): Spinner {
        val categories = listOf("학습팁", "단어비교", "문장학습", "시험준비", "자료공유", "질문", "후기")
        return Spinner(activity).apply {
            adapter = ArrayAdapter(activity, android.R.layout.simple_spinner_item, categories).also { adapter ->
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            }
            setPadding(ui.dp(12), 0, ui.dp(12), 0)
            background = ui.rounded(Theme.Card, 16, Theme.Border)
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
                selectedImagesLabel(),
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
                    isEnabled = selectedImageUris.isNotEmpty()
                    alpha = if (selectedImageUris.isNotEmpty()) 1f else 0.45f
                    setOnClickListener {
                        if (selectedImageUris.isNotEmpty()) onClearImage()
                    }
                }, LinearLayout.LayoutParams(0, ui.dp(48), 1f))
            })
        }
    }

    private fun selectedImagesLabel(): String {
        if (selectedImageUris.isEmpty()) return "선택된 이미지가 없습니다."
        val firstName = selectedImageUris.first().lastPathSegment ?: "이미지"
        return if (selectedImageUris.size == 1) {
            "선택됨: $firstName"
        } else {
            "선택됨: $firstName 외 ${selectedImageUris.size - 1}장"
        }
    }

    private fun publish(titleInput: EditText, categoryInput: Spinner, contentInput: EditText) {
        if (!canSubmit) {
            onRequireLogin()
            return
        }
        if (publishing) return

        val title = titleInput.text.toString().trim()
        val category = categoryInput.selectedItem?.toString().orEmpty().ifBlank { "학습팁" }
        val content = contentInput.text.toString().trim()
        val imageUris = selectedImageUris.take(MAX_IMAGES)

        if (title.isBlank()) {
            Toast.makeText(activity, "제목을 입력하세요.", Toast.LENGTH_SHORT).show()
            return
        }
        if (content.isBlank()) {
            Toast.makeText(activity, "내용을 입력하세요.", Toast.LENGTH_SHORT).show()
            return
        }

        showPublishingDialog()
        if (imageUris.isEmpty()) {
            createPost(title, category, content, imageUrls = emptyList())
            return
        }

        uploadImages(imageUris, mutableListOf()) { imageUrls ->
            createPost(title, category, content, imageUrls)
        }
    }

    private fun uploadImages(remaining: List<Uri>, uploaded: MutableList<String>, onComplete: (List<String>) -> Unit) {
        val next = remaining.firstOrNull()
        if (next == null) {
            onComplete(uploaded)
            return
        }
        imageUploadRepository.uploadCommunityImage(author.id, next) { result ->
            activity.runOnUiThread {
                result
                    .onSuccess { imageUrl ->
                        uploaded.add(imageUrl)
                        uploadImages(remaining.drop(1), uploaded, onComplete)
                    }
                    .onFailure {
                        Toast.makeText(activity, "일부 이미지를 첨부하지 못했습니다.", Toast.LENGTH_SHORT).show()
                        uploadImages(remaining.drop(1), uploaded, onComplete)
                    }
            }
        }
    }

    private fun createPost(title: String, category: String, content: String, imageUrls: List<String>) {
        runCatching {
            communityRepository.addPost(
                author = author,
                title = title,
                content = content,
                category = category,
                imageUrls = imageUrls,
            ) { result ->
                activity.runOnUiThread {
                    result
                        .onSuccess {
                            dismissPublishingDialog()
                            onPostCreated()
                            navigate(Screen.Community)
                        }
                        .onFailure {
                            dismissPublishingDialog()
                            Toast.makeText(activity, "게시 권한을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.", Toast.LENGTH_LONG).show()
                        }
                }
            }
        }.onFailure { error ->
            dismissPublishingDialog()
            Toast.makeText(activity, error.message ?: "게시글 내용을 확인해 주세요.", Toast.LENGTH_LONG).show()
        }
    }

    private fun showPublishingDialog() {
        publishing = true
        publishingDialog = Dialog(activity).apply {
            setCancelable(false)
            setContentView(
                ui.horizontal().apply {
                    gravity = Gravity.CENTER_VERTICAL
                    setPadding(ui.dp(24), ui.dp(18), ui.dp(24), ui.dp(18))
                    background = ui.rounded(Theme.Card, 18, Theme.Border)
                    addView(ProgressBar(activity).apply {
                        isIndeterminate = true
                    }, LinearLayout.LayoutParams(ui.dp(34), ui.dp(34)).apply {
                        setMargins(0, 0, ui.dp(14), 0)
                    })
                    addView(ui.text("게시글을 올리는 중입니다.", 16, Theme.Text, true))
                },
            )
            window?.setBackgroundDrawableResource(android.R.color.transparent)
        }
        publishingDialog?.show()
    }

    private fun dismissPublishingDialog() {
        publishing = false
        publishingDialog?.dismiss()
        publishingDialog = null
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

    companion object {
        private const val MAX_IMAGES = 6
    }
}
