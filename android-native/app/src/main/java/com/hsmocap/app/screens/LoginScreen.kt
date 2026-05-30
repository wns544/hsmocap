package com.hsmocap.app.screens

import android.app.Activity
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.text.InputType
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.hsmocap.app.ui.Theme
import com.hsmocap.app.ui.Ui

class LoginScreen(
    private val activity: Activity,
    private val ui: Ui,
    private val onLogin: (String, String) -> Unit,
    private val onSignup: (String, String) -> Unit,
    private val onGoogleLogin: () -> Unit,
    private val onGuestLogin: () -> Unit,
) {
    fun view(): View {
        return scrollWithContent { box ->
            box.gravity = Gravity.CENTER_HORIZONTAL
            box.setPadding(ui.dp(24), ui.dp(96), ui.dp(24), ui.dp(24))

            val logo = ui.text("W", 42, Theme.Card, true).apply {
                gravity = Gravity.CENTER
                background = ui.rounded(Theme.Primary, 28)
            }
            box.addView(
                logo,
                LinearLayout.LayoutParams(ui.dp(96), ui.dp(96)).apply {
                    setMargins(0, 0, 0, ui.dp(22))
                },
            )
            box.addView(ui.text("워디", 36, Theme.Text, true).center())
            box.addView(
                ui.text("간편하게 로그인하고 학습을 시작하세요", 19, Theme.Muted).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(10), 0, ui.dp(58))
                },
            )

            val email = input("이메일", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS)
            val password = input("비밀번호", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD)
            box.addView(email)
            box.addView(password)

            box.addView(ui.button("이메일로 로그인", Theme.Primary, Theme.Card).apply {
                setOnClickListener {
                    if (email.text.isBlank() || password.text.isBlank()) {
                        Toast.makeText(activity, "이메일과 비밀번호를 입력하세요.", Toast.LENGTH_SHORT).show()
                    } else {
                        onLogin(email.text.toString(), password.text.toString())
                    }
                }
            })
            box.addView(ui.button("회원가입", 0xFFEFFFF8.toInt(), Theme.Primary).apply {
                setOnClickListener {
                    if (email.text.isBlank() || password.text.isBlank()) {
                        Toast.makeText(activity, "이메일과 비밀번호를 입력하세요.", Toast.LENGTH_SHORT).show()
                    } else {
                        onSignup(email.text.toString(), password.text.toString())
                    }
                }
            })
            box.addView(ui.button("Google로 계속하기", 0xFFEFF8FF.toInt(), 0xFF0F4B69.toInt()).apply {
                setOnClickListener { onGoogleLogin() }
            })
            box.addView(ui.button("게스트로 계속하기", 0xFFF9FAFB.toInt(), 0xFF1F2937.toInt()).apply {
                setOnClickListener { onGuestLogin() }
            })
        }
    }

    private fun input(hint: String, inputTypeValue: Int): EditText {
        return EditText(activity).apply {
            this.hint = hint
            inputType = inputTypeValue
            setSingleLine(true)
            textSize = 18f
            setTextColor(Theme.Text)
            setHintTextColor(0xFF808096.toInt())
            setPadding(ui.dp(18), 0, ui.dp(18), 0)
            background = ui.rounded(Theme.Card, 16)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(62)).apply {
                setMargins(0, ui.dp(6), 0, ui.dp(8))
            }
        }
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    private fun TextView.center(): TextView = apply { gravity = Gravity.CENTER }
}
