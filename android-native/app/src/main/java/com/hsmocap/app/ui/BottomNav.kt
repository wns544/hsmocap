package com.hsmocap.app.ui

import android.content.res.ColorStateList
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import com.hsmocap.app.R
import com.hsmocap.app.navigation.Screen

class BottomNav(
    private val ui: Ui,
    private val current: Screen,
    private val navigate: (Screen) -> Unit,
) {
    fun view(): LinearLayout {
        return ui.vertical().apply {
            setBackgroundColor(Theme.Card)
            addView(View(context).apply {
                setBackgroundColor(Theme.Border)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(1)))
            addView(ui.horizontal().apply {
                gravity = Gravity.CENTER
                setBackgroundColor(Theme.Card)
                addView(item(R.drawable.ic_lucide_home, R.drawable.ic_lucide_home_active, "홈", Screen.Home), tabParams())
                addView(item(R.drawable.ic_lucide_book_open, R.drawable.ic_lucide_book_open_active, "학습", Screen.Words), tabParams())
                addView(item(R.drawable.ic_lucide_users, R.drawable.ic_lucide_users_active, "커뮤니티", Screen.Community), tabParams())
                addView(item(R.drawable.ic_lucide_star, R.drawable.ic_lucide_star_active, "즐겨찾기", Screen.Favorites), tabParams())
                addView(item(R.drawable.ic_lucide_settings, R.drawable.ic_lucide_settings_active, "설정", Screen.Settings), tabParams())
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.dp(68)))
        }
    }

    private fun item(icon: Int, activeIcon: Int, label: String, screen: Screen): View {
        val active = current::class == screen::class
        val color = if (active) Theme.Primary else Theme.Muted
        return ui.vertical().apply {
            gravity = Gravity.CENTER
            addView(ImageView(ui.context).apply {
                setImageResource(if (active) activeIcon else icon)
                imageTintList = ColorStateList.valueOf(color)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }, LinearLayout.LayoutParams(ui.dp(20), ui.dp(20)))
            addView(ui.text(label, 12, color, false).apply {
                gravity = Gravity.CENTER
                includeFontPadding = false
                setPadding(0, ui.dp(4), 0, 0)
            })
            setOnClickListener { navigate(screen) }
        }
    }

    private fun tabParams(): LinearLayout.LayoutParams {
        return LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)
    }
}
