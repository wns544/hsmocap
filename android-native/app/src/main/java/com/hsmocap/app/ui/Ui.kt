package com.hsmocap.app.ui

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class Ui(val context: Context) {
    fun dp(value: Int): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        value.toFloat(),
        context.resources.displayMetrics,
    ).toInt()

    fun text(value: String, sp: Int, color: Int = Theme.Text, bold: Boolean = false): TextView {
        return TextView(context).apply {
            text = value
            setTextColor(color)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, sp.toFloat())
            includeFontPadding = true
            if (bold) typeface = Typeface.DEFAULT_BOLD
        }
    }

    fun button(label: String, background: Int, foreground: Int): Button {
        return Button(context).apply {
            text = label
            isAllCaps = false
            setTextColor(foreground)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
            typeface = Typeface.DEFAULT_BOLD
            this.background = rounded(background, 14, if (background == Theme.Card) Theme.Border else background)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(56),
            ).apply {
                setMargins(0, dp(6), 0, dp(8))
            }
        }
    }

    fun icon(iconRes: Int, color: Int, sizeDp: Int): ImageView {
        return ImageView(context).apply {
            setImageResource(iconRes)
            imageTintList = ColorStateList.valueOf(color)
            scaleType = ImageView.ScaleType.FIT_CENTER
            layoutParams = LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp))
        }
    }

    fun card(): LinearLayout {
        return vertical().apply {
            setPadding(dp(18), dp(16), dp(18), dp(16))
            background = rounded(Theme.Card, 16, Theme.Border)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            ).apply {
                setMargins(0, dp(6), 0, dp(8))
            }
        }
    }

    fun vertical(): LinearLayout {
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
        }
    }

    fun horizontal(): LinearLayout {
        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
        }
    }

    fun weighted(widthWeight: Float = 1f): LinearLayout.LayoutParams {
        return LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, widthWeight).apply {
            setMargins(dp(4), 0, dp(4), 0)
        }
    }

    fun navLabel(icon: String, label: String, active: Boolean): LinearLayout {
        val color = if (active) Theme.Primary else Theme.Muted
        return vertical().apply {
            gravity = Gravity.CENTER
            addView(text(icon, 23, color, true).apply { gravity = Gravity.CENTER })
            addView(text(label, 12, color, true).apply { gravity = Gravity.CENTER })
        }
    }

    fun rounded(color: Int, radiusDp: Int, strokeColor: Int? = null): GradientDrawable {
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radiusDp).toFloat()
            if (strokeColor != null) {
                setStroke(dp(1), strokeColor)
            }
        }
    }

    fun spacer(heightDp: Int): View {
        return View(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(heightDp),
            )
        }
    }
}
