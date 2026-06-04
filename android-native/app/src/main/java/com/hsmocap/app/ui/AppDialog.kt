package com.hsmocap.app.ui

import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

object AppDialog {
    fun confirm(
        activity: Activity,
        ui: Ui,
        title: String,
        message: String,
        negativeLabel: String,
        positiveLabel: String,
        onPositive: () -> Unit,
        onNegative: (() -> Unit)? = null,
        primaryActionOnLeft: Boolean = false,
    ) {
        val dialog = Dialog(activity)
        val box = container(ui)
        box.addView(titleView(ui, title))
        box.addView(messageView(ui, message))
        box.addView(actions(ui, dialog, negativeLabel, positiveLabel, onNegative, onPositive, primaryActionOnLeft = primaryActionOnLeft))
        show(activity, dialog, box)
    }

    fun choices(
        activity: Activity,
        ui: Ui,
        title: String,
        options: List<String>,
        selectedIndex: Int,
        onSelected: (Int) -> Unit,
    ) {
        val dialog = Dialog(activity)
        val box = container(ui)
        box.addView(titleView(ui, title))
        options.forEachIndexed { index, label ->
            box.addView(choiceRow(ui, label, index == selectedIndex).apply {
                setOnClickListener {
                    dialog.dismiss()
                    onSelected(index)
                }
            })
        }
        box.addView(singleAction(ui, dialog, "취소"))
        show(activity, dialog, box)
    }

    fun textInput(
        activity: Activity,
        ui: Ui,
        title: String,
        message: String,
        hint: String,
        initialValue: String,
        negativeLabel: String,
        positiveLabel: String,
        onPositive: (Dialog, String) -> Unit,
    ) {
        val dialog = Dialog(activity)
        val box = container(ui)
        val input = EditText(activity).apply {
            setText(initialValue)
            this.hint = hint
            setSingleLine(true)
            setSelection(text.length)
            textSize = 16f
            setTextColor(Theme.Text)
            setHintTextColor(Theme.Muted)
            setPadding(ui.dp(16), 0, ui.dp(16), 0)
            background = ui.rounded(Theme.Card, 16, Theme.Border)
        }
        box.addView(titleView(ui, title))
        box.addView(messageView(ui, message))
        box.addView(input, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(58)).apply {
            setMargins(0, ui.dp(4), 0, ui.dp(14))
        })
        box.addView(actions(
            ui = ui,
            dialog = dialog,
            negativeLabel = negativeLabel,
            positiveLabel = positiveLabel,
            onNegative = null,
            onPositive = { onPositive(dialog, input.text.toString()) },
            dismissOnPositive = false,
        ))
        show(activity, dialog, box)
    }

    private fun container(ui: Ui): LinearLayout {
        return ui.vertical().apply {
            setPadding(ui.dp(22), ui.dp(22), ui.dp(22), ui.dp(18))
            background = ui.rounded(Theme.Card, 24)
        }
    }

    private fun titleView(ui: Ui, title: String): TextView {
        return ui.text(title, 22, Theme.Text, true).apply {
            includeFontPadding = false
            setPadding(0, 0, 0, ui.dp(8))
        }
    }

    private fun messageView(ui: Ui, message: String): TextView {
        return ui.text(message, 15, Theme.Muted).apply {
            setLineSpacing(ui.dp(4).toFloat(), 1f)
            setPadding(0, 0, 0, ui.dp(16))
        }
    }

    private fun choiceRow(ui: Ui, label: String, selected: Boolean): TextView {
        return ui.text(label, 16, if (selected) Theme.Primary else Theme.Text, selected).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(16), 0, ui.dp(16), 0)
            background = ui.rounded(
                if (selected) 0xFFEFFFF8.toInt() else Theme.Card,
                16,
                if (selected) Theme.Primary else Theme.Border,
            )
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(54)).apply {
                setMargins(0, 0, 0, ui.dp(8))
            }
        }
    }

    private fun actions(
        ui: Ui,
        dialog: Dialog,
        negativeLabel: String,
        positiveLabel: String,
        onNegative: (() -> Unit)?,
        onPositive: () -> Unit,
        dismissOnPositive: Boolean = true,
        primaryActionOnLeft: Boolean = false,
    ): LinearLayout {
        return ui.horizontal().apply {
            setPadding(0, ui.dp(2), 0, 0)
            if (primaryActionOnLeft) {
                addView(dialogButton(ui, positiveLabel, Theme.Primary, Theme.Card).apply {
                    setOnClickListener {
                        if (dismissOnPositive) dialog.dismiss()
                        onPositive()
                    }
                }, LinearLayout.LayoutParams(0, ui.dp(52), 1f).apply {
                    setMargins(0, 0, ui.dp(8), 0)
                })
                addView(dialogButton(ui, negativeLabel, Theme.Card, Theme.Muted).apply {
                    setOnClickListener {
                        dialog.dismiss()
                        onNegative?.invoke()
                    }
                }, LinearLayout.LayoutParams(0, ui.dp(52), 1f))
                return@apply
            }
            addView(dialogButton(ui, negativeLabel, Theme.Card, Theme.Muted).apply {
                setOnClickListener {
                    dialog.dismiss()
                    onNegative?.invoke()
                }
            }, LinearLayout.LayoutParams(0, ui.dp(52), 1f).apply {
                setMargins(0, 0, ui.dp(8), 0)
            })
            addView(dialogButton(ui, positiveLabel, Theme.Primary, Theme.Card).apply {
                setOnClickListener {
                    if (dismissOnPositive) dialog.dismiss()
                    onPositive()
                }
            }, LinearLayout.LayoutParams(0, ui.dp(52), 1f))
        }
    }

    private fun singleAction(ui: Ui, dialog: Dialog, label: String): View {
        return dialogButton(ui, label, Theme.Card, Theme.Muted).apply {
            setOnClickListener { dialog.dismiss() }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(52)).apply {
                setMargins(0, ui.dp(2), 0, 0)
            }
        }
    }

    private fun dialogButton(ui: Ui, label: String, backgroundColor: Int, foreground: Int): TextView {
        return ui.text(label, 16, foreground, true).apply {
            gravity = Gravity.CENTER
            typeface = Typeface.DEFAULT_BOLD
            background = ui.rounded(backgroundColor, 16, if (backgroundColor == Theme.Card) Theme.Border else backgroundColor)
            isClickable = true
            elevation = 0f
            stateListAnimator = null
        }
    }

    private fun show(activity: Activity, dialog: Dialog, content: View) {
        dialog.setContentView(content)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()
        dialog.window?.setLayout((activity.resources.displayMetrics.widthPixels * 0.9f).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT)
    }
}
