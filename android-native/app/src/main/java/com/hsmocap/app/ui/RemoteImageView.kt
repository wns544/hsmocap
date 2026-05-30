package com.hsmocap.app.ui

import android.content.Context
import android.graphics.BitmapFactory
import android.util.Base64
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import java.net.URL

class RemoteImageView(
    context: Context,
    private val imageUrl: String,
    private val ui: Ui,
    heightDp: Int,
) : ImageView(context) {
    init {
        scaleType = ScaleType.CENTER_CROP
        setBackgroundColor(Theme.Card)
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ui.dp(heightDp),
        )
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        load()
    }

    private fun load() {
        val url = imageUrl.trim()
        if (url.isBlank()) return
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
                    if (bitmap != null) setImageBitmap(bitmap)
                }
            }
        }.start()
    }
}
