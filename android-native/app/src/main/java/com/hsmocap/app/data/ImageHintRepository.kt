package com.hsmocap.app.data

import android.content.Context
import android.util.Log
import com.hsmocap.app.firebase.FirebaseBackend
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class ImageHintResult(
    val imageUrl: String,
    val descriptionUrl: String,
    val title: String,
)

interface ImageHintRepository {
    fun findHint(word: Word, callback: (Result<ImageHintResult>) -> Unit)
}

class FirebaseFunctionImageHintRepository(context: Context) : ImageHintRepository {
    init {
        require(FirebaseBackend.isAvailable(context)) { "Firebase 설정을 찾을 수 없습니다." }
    }

    override fun findHint(word: Word, callback: (Result<ImageHintResult>) -> Unit) {
        Thread {
            runCatching { postHintRequest(word) }
                .onSuccess { callback(Result.success(it)) }
                .onFailure {
                    Log.e(TAG, "Image hint request failed for ${word.word}", it)
                    callback(Result.failure(it))
                }
        }.start()
    }

    private fun postHintRequest(word: Word): ImageHintResult {
        val payload = JSONObject()
            .put("targetWord", word.word)
            .put("english", word.exampleSentence)
            .put("wordMeaning", word.meaning)

        val connection = (URL(FUNCTION_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 7000
            readTimeout = 12000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Origin", "https://hsmocap-d907e.web.app")
        }

        OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
            writer.write(payload.toString())
        }

        val code = connection.responseCode
        val body = (if (code in 200..299) connection.inputStream else connection.errorStream)
            ?.bufferedReader()
            ?.use { it.readText() }
            .orEmpty()
        if (code !in 200..299) {
            throw IllegalStateException(JSONObject(body.ifBlank { "{}" }).optString("error", "이미지 힌트 요청 실패: HTTP $code"))
        }

        val json = JSONObject(body)
        val imageUrl = json.optString("imageUrl")
        val descriptionUrl = json.optString("descriptionUrl")
        val title = json.optString("title", word.word)
        if (imageUrl.isBlank() || descriptionUrl.isBlank()) {
            throw IllegalStateException("이미지 힌트 응답이 비어 있습니다.")
        }

        return ImageHintResult(
            imageUrl = imageUrl,
            descriptionUrl = descriptionUrl,
            title = title.ifBlank { word.word },
        )
    }

    companion object {
        private const val TAG = "WordyImageHint"
        private const val FUNCTION_URL = "https://asia-northeast3-hsmocap-d907e.cloudfunctions.net/imageHintSearchHttp"
    }
}

class UnavailableImageHintRepository : ImageHintRepository {
    override fun findHint(word: Word, callback: (Result<ImageHintResult>) -> Unit) {
        callback(Result.failure(IllegalStateException("Firebase 연결 후 이미지 힌트를 사용할 수 있습니다.")))
    }
}
