package com.hsmocap.app.screens

import android.app.Activity
import android.app.Dialog
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.text.InputType
import android.text.method.PasswordTransformationMethod
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.hsmocap.app.R
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

            val logo = ImageView(activity).apply {
                setImageResource(R.mipmap.ic_launcher)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }
            box.addView(
                logo,
                LinearLayout.LayoutParams(ui.dp(96), ui.dp(96)).apply {
                    setMargins(0, 0, 0, ui.dp(22))
                },
            )
            box.addView(ui.text("Wordy", 36, Theme.Text, true).center())
            box.addView(
                ui.text("이메일로 로그인하거나 새 계정을 만들어 학습을 시작하세요.", 17, Theme.Muted).apply {
                    gravity = Gravity.CENTER
                    setPadding(0, ui.dp(10), 0, ui.dp(40))
                },
            )

            val email = input("이메일", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS)
            val password = passwordInput("비밀번호")
            box.addView(email)
            box.addView(password)

            box.addView(loginAction(
                label = "이메일로 로그인",
                background = Theme.Primary,
                foreground = Theme.Card,
                iconRes = R.drawable.ic_lucide_mail,
                iconTint = Theme.Card,
            ).apply {
                setOnClickListener {
                    if (email.text.isBlank() || password.text.isBlank()) {
                        Toast.makeText(activity, "이메일과 비밀번호를 입력해 주세요.", Toast.LENGTH_SHORT).show()
                    } else {
                        onLogin(email.text.toString(), password.text.toString())
                    }
                }
            })
            box.addView(loginAction("Google 계정으로 계속하기", 0xFFEFF8FF.toInt(), 0xFF0F4B69.toInt(), R.drawable.ic_chrome_mark).apply {
                setOnClickListener { onGoogleLogin() }
            })
            box.addView(loginAction(
                label = "게스트로 계속하기",
                background = Theme.Card,
                foreground = 0xFF374151.toInt(),
                iconRes = R.drawable.ic_lucide_user,
                iconTint = 0xFF374151.toInt(),
                border = 0xFFD1D5DB.toInt(),
                bottomMarginDp = 12,
            ).apply {
                setOnClickListener { onGuestLogin() }
            })
            box.addView(signupPrompt().apply {
                setOnClickListener {
                    showSignupDialog(email.text.toString(), password.text.toString())
                }
            })
        }
    }

    private fun input(hint: String, inputTypeValue: Int): EditText {
        return EditText(activity).apply {
            this.hint = hint
            inputType = inputTypeValue
            if (inputTypeValue and InputType.TYPE_TEXT_VARIATION_PASSWORD == InputType.TYPE_TEXT_VARIATION_PASSWORD) {
                transformationMethod = PasswordTransformationMethod.getInstance()
            }
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

    private fun showSignupDialog(initialEmail: String, initialPassword: String) {
        val dialog = Dialog(activity)
        val form = ui.vertical().apply {
            setPadding(ui.dp(22), ui.dp(22), ui.dp(22), ui.dp(18))
            background = ui.rounded(Theme.Card, 24)
        }
        val signupEmail = input("이메일", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS).apply {
            setText(initialEmail)
        }
        val signupPassword = passwordInput("비밀번호 (6자 이상)").apply {
            setText(initialPassword)
        }
        val signupPasswordConfirm = passwordInput("비밀번호 확인")

        form.addView(ui.text("회원가입", 24, Theme.Text, true))
        form.addView(ui.text("새 계정에 사용할 이메일과 비밀번호를 입력해 주세요.", 14, Theme.Muted).apply {
            setPadding(0, ui.dp(6), 0, ui.dp(16))
        })
        form.addView(label("이메일"))
        form.addView(signupEmail)
        form.addView(label("비밀번호"))
        form.addView(signupPassword)
        form.addView(label("비밀번호 확인"))
        form.addView(signupPasswordConfirm)

        form.addView(ui.horizontal().apply {
            setPadding(0, ui.dp(12), 0, 0)
            addView(dialogButton("취소", Theme.Card, Theme.Muted).apply {
                setOnClickListener { dialog.dismiss() }
            }, LinearLayout.LayoutParams(0, ui.dp(52), 1f).apply {
                setMargins(0, 0, ui.dp(8), 0)
            })
            addView(dialogButton("가입하기", Theme.Primary, Theme.Card).apply {
                setOnClickListener {
                    val emailValue = signupEmail.text.toString()
                    val passwordValue = signupPassword.text.toString()
                    if (emailValue.isBlank() || passwordValue.isBlank()) {
                        Toast.makeText(activity, "이메일과 비밀번호를 입력해 주세요.", Toast.LENGTH_SHORT).show()
                        return@setOnClickListener
                    }
                    if (passwordValue.length < 6) {
                        Toast.makeText(activity, "비밀번호는 6자 이상이어야 합니다.", Toast.LENGTH_SHORT).show()
                        return@setOnClickListener
                    }
                    if (passwordValue != signupPasswordConfirm.text.toString()) {
                        Toast.makeText(activity, "비밀번호 확인이 일치하지 않습니다.", Toast.LENGTH_SHORT).show()
                        return@setOnClickListener
                    }
                    dialog.dismiss()
                    onSignup(emailValue, passwordValue)
                }
            }, LinearLayout.LayoutParams(0, ui.dp(52), 1f))
        })

        dialog.setContentView(form)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()
        dialog.window?.setLayout((activity.resources.displayMetrics.widthPixels * 0.9f).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT)
    }

    private fun scrollWithContent(build: (LinearLayout) -> Unit): ScrollView {
        val scroll = ScrollView(activity)
        val box = ui.vertical()
        scroll.addView(box)
        build(box)
        return scroll
    }

    private fun passwordInput(hint: String): EditText {
        var visible = false
        return input(hint, InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD).apply {
            typeface = Typeface.DEFAULT
            compoundDrawableTintList = ColorStateList.valueOf(Theme.Muted)
            setCompoundDrawablePadding(ui.dp(12))

            fun applyVisibility() {
                inputType = InputType.TYPE_CLASS_TEXT or if (visible) {
                    InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                } else {
                    InputType.TYPE_TEXT_VARIATION_PASSWORD
                }
                transformationMethod = if (visible) null else PasswordTransformationMethod.getInstance()
                typeface = Typeface.DEFAULT
                setCompoundDrawablesWithIntrinsicBounds(
                    0,
                    0,
                    if (visible) R.drawable.ic_lucide_eye else R.drawable.ic_lucide_eye_off,
                    0,
                )
                setSelection(text?.length ?: 0)
            }

            applyVisibility()
            setOnTouchListener { view, event ->
                if (event.action == MotionEvent.ACTION_UP) {
                    val drawable = compoundDrawables[2]
                    val tappedIcon = drawable != null && event.x >= width - paddingRight - drawable.bounds.width() - ui.dp(16)
                    if (tappedIcon) {
                        visible = !visible
                        applyVisibility()
                        view.performClick()
                        return@setOnTouchListener true
                    }
                }
                false
            }
        }
    }

    private fun loginAction(
        label: String,
        background: Int,
        foreground: Int,
        iconRes: Int,
        iconTint: Int? = null,
        border: Int? = null,
        bottomMarginDp: Int = 8,
    ): LinearLayout {
        return ui.horizontal().apply {
            gravity = Gravity.CENTER
            elevation = 0f
            stateListAnimator = null
            setPadding(ui.dp(18), 0, ui.dp(18), 0)
            this.background = ui.rounded(background, 14, border ?: if (background == Theme.Card) Theme.Border else background)
            isClickable = true
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(56)).apply {
                setMargins(0, ui.dp(6), 0, ui.dp(bottomMarginDp))
            }
            addView(ImageView(activity).apply {
                setImageResource(iconRes)
                imageTintList = iconTint?.let { ColorStateList.valueOf(it) }
                scaleType = ImageView.ScaleType.FIT_CENTER
            }, LinearLayout.LayoutParams(ui.dp(22), ui.dp(22)).apply {
                setMargins(0, 0, ui.dp(10), 0)
            })
            addView(ui.text(label, 17, foreground, true))
        }
    }

    private fun signupPrompt(): TextView {
        return ui.text("이메일 계정 만들기", 15, Theme.Primary, true).apply {
            gravity = Gravity.CENTER
            setPadding(0, ui.dp(12), 0, ui.dp(4))
            isClickable = true
        }
    }

    private fun <T : View> T.flat(): T = apply {
        elevation = 0f
        stateListAnimator = null
    }

    private fun dialogButton(label: String, backgroundColor: Int, foreground: Int): TextView {
        return ui.text(label, 16, foreground, true).apply {
            gravity = Gravity.CENTER
            background = ui.rounded(backgroundColor, 16, if (backgroundColor == Theme.Card) Theme.Border else backgroundColor)
            isClickable = true
        }
    }

    private fun label(value: String): TextView {
        return ui.text(value, 13, Theme.Muted, true).apply {
            setPadding(0, ui.dp(6), 0, 0)
        }
    }

    private fun TextView.center(): TextView = apply { gravity = Gravity.CENTER }
}
