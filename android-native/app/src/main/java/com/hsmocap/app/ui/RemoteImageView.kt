package com.hsmocap.app.ui

import android.content.Context
import android.graphics.BitmapFactory
import android.util.Base64
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import java.net.URL

class RemoteImageView(
    context: Context,
    private val imageUrl: String,
    private val ui: Ui,
    heightDp: Int,
) : FrameLayout(context) {
    private val imageView = ImageView(context).apply {
        scaleType = ImageView.ScaleType.CENTER_CROP
        setBackgroundColor(Theme.Card)
    }
    private val progress = ProgressBar(context).apply {
        isIndeterminate = true
    }
    private var loadingStarted = false

    init {
        setBackgroundColor(Theme.Card)
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ui.dp(heightDp),
        )
        addView(
            imageView,
            LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
        )
        addView(
            progress,
            LayoutParams(ui.dp(34), ui.dp(34), Gravity.CENTER),
        )
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (loadingStarted) return
        loadingStarted = true
        load()
    }

    fun setImageScaleType(scaleType: ImageView.ScaleType) {
        imageView.scaleType = scaleType
    }

    private fun load() {
        val url = imageUrl.trim()
        if (url.isBlank()) {
            progress.visibility = View.GONE
            return
        }
        Thread {
            runCatching {
                if (url.startsWith("data:image")) {
                    val encoded = url.substringAfter(",", "")
                    val bytes = Base64.decode(encoded, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                } else {
                    val connection = URL(url).openConnection().apply {
                        connectTimeout = 7000
                        readTimeout = 7000
                    }
                    connection.getInputStream().use { stream ->
                        BitmapFactory.decodeStream(stream)
                    }
                }
            }.onSuccess { bitmap ->
                post {
                    if (bitmap != null) {
                        imageView.setImageBitmap(bitmap)
                    }
                    progress.visibility = View.GONE
                }
            }.onFailure {
                post {
                    progress.visibility = View.GONE
                }
            }
        }.start()
    }
}
