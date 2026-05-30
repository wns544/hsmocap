package com.hsmocap.app.screens

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.res.ColorStateList
import android.net.Uri
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.hsmocap.app.R
import com.hsmocap.app.auth.AuthUser
import com.hsmocap.app.data.NativeSettings
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.firebase.FirebaseStatus
import com.hsmocap.app.navigation.Screen
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class SettingsScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val store: StudyStore,
    private val settings: NativeSettings,
    private val currentUser: AuthUser?,
    private val backendStatus: FirebaseStatus,
    private val syncMetadata: String,
    private val onDataChanged: () -> Unit,
    private val onLogout: () -> Unit,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): View {
        return scrollWithContent { box ->
            box.setPadding(0, 0, 0, ui.dp(24))
            box.addView(header())

            val body = ui.vertical().apply {
                setPadding(ui.dp(16), ui.dp(20), ui.dp(16), ui.dp(10))
            }
            body.addView(group("계정", listOf(
                settingItem("프로필", iconRes = R.drawable.ic_lucide_user) {
                    navigate(Screen.Profile)
                },
            )))
            body.addView(group("학습 설정", listOf(
                settingItem("일일 학습 목표", value = "${settings.dailyGoal}개") {
                    showDailyGoalDialog()
                },
            )))
            body.addView(group("지원", listOf(
                settingItem("도움말", iconRes = R.drawable.ic_lucide_circle_help) {
                    navigate(Screen.Help)
                },
                settingItem("피드백 보내기", iconRes = R.drawable.ic_lucide_message_square) {
                    navigate(Screen.Feedback)
                },
                settingItem("내 피드백 현황", iconRes = R.drawable.ic_lucide_message_square) {
                    openFeedbackStatus()
                },
                settingItem("개인정보 보호", iconRes = R.drawable.ic_lucide_shield) {
                    navigate(Screen.Privacy)
                },
            )))
            if (currentUser?.isAdmin == true) {
                body.addView(group("관리", listOf(
                    settingItem("관리자 대시보드", iconRes = R.drawable.ic_lucide_code, value = "Admin") {
                        openAdminDashboard()
                    },
                )))
            }
            body.addView(appInfoCard())
            box.addView(body)
        }
    }

    private fun header(): View {
        return ui.vertical().apply {
            setPadding(ui.dp(18), ui.dp(56), ui.dp(18), ui.dp(32))
            setBackgroundColor(Theme.Card)
            addView(ui.text("설정", 32, Theme.Text, true).apply {
                includeFontPadding = false
            })
            addView(ui.text("환경과 지원 경로를 관리해 보세요.", 16, Theme.Muted).apply {
                setPadding(0, ui.dp(14), 0, 0)
            })
        }
    }

    private fun group(title: String, rows: List<View>): View {
        return ui.vertical().apply {
            addView(groupTitle(title))
            addView(ui.vertical().apply {
                background = ui.rounded(Theme.Card, 18, Theme.Border)
                rows.forEachIndexed { index, row ->
                    addView(row)
                    if (index < rows.lastIndex) {
                        addView(View(activity).apply {
                            setBackgroundColor(Theme.Border)
                        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(1)).apply {
                            setMargins(ui.dp(26), 0, ui.dp(26), 0)
                        })
                    }
                }
            })
        }
    }

    private fun groupTitle(title: String): TextView {
        return ui.text(title, 14, Theme.Muted).apply {
            includeFontPadding = false
            setPadding(ui.dp(6), ui.dp(18), 0, ui.dp(10))
        }
    }

    private fun settingItem(
        label: String,
        iconRes: Int? = null,
        value: String? = null,
        onClick: () -> Unit,
    ): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(26), ui.dp(18), ui.dp(22), ui.dp(18))
            minimumHeight = ui.dp(80)
            setOnClickListener { onClick() }
            if (iconRes != null) {
                addView(tintedIcon(iconRes, Theme.Muted, 22), LinearLayout.LayoutParams(ui.dp(24), ui.dp(24)).apply {
                    setMargins(0, 0, ui.dp(16), 0)
                })
            }
            addView(ui.text(label, 17, Theme.Text), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            if (value != null) {
                addView(ui.text(value, 15, Theme.Muted).apply {
                    gravity = Gravity.CENTER_VERTICAL or Gravity.RIGHT
                    setPadding(0, 0, ui.dp(10), 0)
                })
            }
            addView(tintedIcon(R.drawable.ic_lucide_chevron_right, Theme.Muted, 20), LinearLayout.LayoutParams(ui.dp(22), ui.dp(22)))
        }
    }

    private fun appInfoCard(): View {
        return ui.vertical().apply {
            setPadding(ui.dp(26), ui.dp(20), ui.dp(26), ui.dp(20))
            background = ui.rounded(Theme.Card, 18, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, ui.dp(30), 0, 0)
            }
            addView(infoRow("앱 버전", "1.0.0"))
            addView(infoRow("최신 업데이트", "2026.05.30"))
        }
    }

    private fun infoRow(label: String, value: String): View {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, ui.dp(6), 0, ui.dp(6))
            addView(ui.text(label, 16, Theme.Muted), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(ui.text(value, 15, Theme.Text))
        }
    }

    private fun showDailyGoalDialog() {
        val labels = arrayOf("10개", "20개", "30개", "직접 입력: 50개")
        val values = intArrayOf(10, 20, 30, 50)
        val checked = values.indexOf(settings.dailyGoal).takeIf { it >= 0 } ?: 1
        AlertDialog.Builder(activity)
            .setTitle("일일 학습 목표")
            .setSingleChoiceItems(labels, checked) { dialog, which ->
                settings.dailyGoal = values[which]
                Toast.makeText(activity, "일일 목표를 ${values[which]}개로 설정했습니다.", Toast.LENGTH_SHORT).show()
                dialog.dismiss()
                onDataChanged()
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun openAdminDashboard() {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ADMIN_DASHBOARD_URL))
        runCatching { activity.startActivity(intent) }
            .onFailure {
                Toast.makeText(activity, "관리자 대시보드를 열 수 없습니다.", Toast.LENGTH_SHORT).show()
            }
    }

    private fun openFeedbackStatus() {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(FEEDBACK_STATUS_URL))
        runCatching { activity.startActivity(intent) }
            .onFailure {
                Toast.makeText(activity, "피드백 현황을 열 수 없습니다.", Toast.LENGTH_SHORT).show()
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

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    companion object {
        private const val ADMIN_DASHBOARD_URL = "https://hsmocap-d907e.web.app/app/admin"
        private const val FEEDBACK_STATUS_URL = "https://hsmocap-d907e.web.app/app/settings/feedback/history"
    }
}
