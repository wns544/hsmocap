package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Switch
import android.widget.Toast
import com.hsmocap.app.R
import com.hsmocap.app.auth.AuthUser
import com.hsmocap.app.data.CreateFeedbackRequest
import com.hsmocap.app.data.FeedbackRepository
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

private fun settingsBack(ui: Ui, navigate: (Screen) -> Unit): View = ui.horizontal().apply {
    gravity = Gravity.CENTER_VERTICAL
    setPadding(0, 0, 0, ui.dp(18))
    setOnClickListener { navigate(Screen.Settings) }
    addView(ui.icon(R.drawable.ic_lucide_chevron_left, Theme.Primary, 18), LinearLayout.LayoutParams(ui.dp(18), ui.dp(18)))
    addView(ui.text("설정", 18, Theme.Primary, true))
}

class HelpScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View = page("도움말", "주요 기능과 추천 사용 흐름을 확인하세요.") { box ->
        listOf(
            "홈" to "오늘의 학습 상태와 빠른 시작 버튼을 확인합니다.",
            "학습" to "단어 목록, 문장 퀴즈, 플래시카드, 오답 복습으로 이동합니다.",
            "커뮤니티" to "학습 경험, 질문, 인증 글을 읽고 작성합니다.",
            "즐겨찾기" to "중요한 단어를 모아 반복 학습합니다.",
            "설정" to "프로필, 알림, 동기화, 개인정보, 피드백을 관리합니다.",
        ).forEach { (title, body) ->
            box.addView(infoCard(title, body))
        }
    }

    private fun page(title: String, subtitle: String, build: (LinearLayout) -> Unit): View {
        return ScrollView(activity).apply {
            addView(ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
                addView(back())
                addView(ui.text(title, 30, Theme.Text, true))
                addView(ui.text(subtitle, 15, Theme.Muted).apply { setPadding(0, ui.dp(4), 0, ui.dp(18)) })
                build(this)
            })
        }
    }

    private fun back(): View = settingsBack(ui, navigate)

    private fun infoCard(title: String, body: String): View = ui.card().apply {
        addView(ui.text(title, 18, Theme.Text, true))
        addView(ui.text(body, 14, Theme.Muted).apply {
            setPadding(0, ui.dp(8), 0, 0)
            setLineSpacing(ui.dp(4).toFloat(), 1f)
        })
    }
}

class FeedbackScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val feedbackRepository: FeedbackRepository,
    private val user: AuthUser?,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return ScrollView(activity).apply {
            addView(ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
                addView(settingsBack(ui, navigate))
                addView(ui.text("피드백 보내기", 30, Theme.Text, true))
                addView(ui.text("불편한 점이나 제안을 남겨주세요.", 15, Theme.Muted).apply {
                    setPadding(0, ui.dp(4), 0, ui.dp(18))
                })
                val categoryInput = input("카테고리").apply { setText("버그 제보") }
                val titleInput = input("제목")
                val bodyInput = input("내용").apply {
                    setSingleLine(false)
                    gravity = Gravity.TOP
                    minLines = 7
                }
                val importantSwitch = Switch(activity).apply {
                    text = "중요 피드백"
                    textSize = 15f
                    setTextColor(Theme.Text)
                    setPadding(0, 0, 0, ui.dp(12))
                }
                addView(label("카테고리"))
                addView(ui.text("버그 제보, 기능 제안, 사용성, 디자인, 기타 중 하나를 입력하세요.", 12, Theme.Muted).apply {
                    setPadding(0, 0, 0, ui.dp(8))
                })
                addView(categoryInput, fieldParams())
                addView(label("제목"))
                addView(titleInput, fieldParams())
                addView(label("내용"))
                addView(bodyInput, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(190)).apply {
                    setMargins(0, 0, 0, ui.dp(12))
                })
                addView(importantSwitch)
                addView(ui.button("피드백 등록", Theme.Primary, Theme.Card).apply {
                    setOnClickListener {
                        val currentUser = user
                        if (currentUser == null) {
                            Toast.makeText(activity, "피드백은 로그인 후 보낼 수 있습니다.", Toast.LENGTH_SHORT).show()
                        } else if (titleInput.text.isBlank() || bodyInput.text.isBlank()) {
                            Toast.makeText(activity, "제목과 내용을 입력하세요.", Toast.LENGTH_SHORT).show()
                        } else {
                            submitFeedback(currentUser, categoryInput, titleInput, bodyInput, importantSwitch.isChecked)
                        }
                    }
                })
            })
        }
    }

    private fun submitFeedback(
        currentUser: AuthUser,
        categoryInput: EditText,
        titleInput: EditText,
        bodyInput: EditText,
        isImportant: Boolean,
    ) {
        val categoryName = categoryInput.text.toString().trim().ifBlank { "기타" }
        feedbackRepository.createFeedback(
            CreateFeedbackRequest(
                user = currentUser,
                categoryId = categoryIdFor(categoryName),
                categoryName = categoryName,
                title = titleInput.text.toString(),
                body = bodyInput.text.toString(),
                isImportant = isImportant,
            ),
        ) { result ->
            activity.runOnUiThread {
                result
                    .onSuccess {
                        titleInput.text.clear()
                        bodyInput.text.clear()
                        Toast.makeText(activity, "피드백을 등록했습니다.", Toast.LENGTH_SHORT).show()
                        navigate(Screen.Settings)
                    }
                    .onFailure { error ->
                        Toast.makeText(activity, error.localizedMessage ?: "피드백 등록에 실패했습니다.", Toast.LENGTH_SHORT).show()
                    }
            }
        }
    }

    private fun input(hintValue: String): EditText = EditText(activity).apply {
        hint = hintValue
        textSize = 16f
        setTextColor(Theme.Text)
        setHintTextColor(Theme.Muted)
        setPadding(ui.dp(16), 0, ui.dp(16), 0)
        background = ui.rounded(Theme.Card, 16, Theme.Border)
    }

    private fun fieldParams(): LinearLayout.LayoutParams {
        return LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(58)).apply {
            setMargins(0, 0, 0, ui.dp(12))
        }
    }

    private fun label(value: String): View {
        return ui.text(value, 14, Theme.Muted, true).apply {
            setPadding(0, ui.dp(4), 0, ui.dp(8))
        }
    }

    private fun categoryIdFor(value: String): String {
        return when (value.trim()) {
            "버그 제보" -> "bug"
            "기능 제안" -> "feature"
            "사용성" -> "usability"
            "디자인" -> "design"
            else -> "other"
        }
    }
}

class PrivacyScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return ScrollView(activity).apply {
            addView(ui.vertical().apply {
                setPadding(ui.dp(24), ui.dp(52), ui.dp(24), ui.dp(24))
                addView(settingsBack(ui, navigate))
                addView(ui.text("개인정보 보호약관", 30, Theme.Text, true))
                addView(ui.text("Wordy는 이용자의 개인정보를 존중합니다.", 15, Theme.Muted).apply {
                    setPadding(0, ui.dp(4), 0, ui.dp(18))
                })
                listOf(
                    "수집 항목" to "이메일, 닉네임, 로그인 정보, 학습 기록, 서비스 이용 로그를 서비스 제공 범위에서 사용합니다.",
                    "이용 목적" to "회원 인증, 학습 통계, 맞춤형 학습 경험, 문의 대응, 서비스 안정성 확보에 사용합니다.",
                    "보관 및 삭제" to "목적 달성 또는 회원 탈퇴 시 관련 법령에 따라 필요한 범위를 제외하고 삭제합니다.",
                    "권리 행사" to "개인정보 열람, 정정, 삭제 요청은 피드백 채널을 통해 접수할 수 있습니다.",
                ).forEach { (title, body) ->
                    addView(ui.card().apply {
                        addView(ui.text(title, 18, Theme.Text, true))
                        addView(ui.text(body, 14, Theme.Muted).apply {
                            setPadding(0, ui.dp(8), 0, 0)
                            setLineSpacing(ui.dp(4).toFloat(), 1f)
                        })
                    })
                }
            })
        }
    }
}
