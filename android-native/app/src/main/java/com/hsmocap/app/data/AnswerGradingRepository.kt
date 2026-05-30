package com.hsmocap.app.data

import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import com.hsmocap.app.firebase.FirebaseBackend
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class GradeAnswerRequest(
    val word: Word,
    val userAnswer: String,
)

data class GradeAnswerResult(
    val isCorrect: Boolean,
    val verdict: String,
    val message: String,
    val hint: String?,
)

interface AnswerGradingRepository {
    fun grade(request: GradeAnswerRequest, callback: (Result<GradeAnswerResult>) -> Unit)
}

class FirebaseFunctionAnswerGradingRepository(context: Context) : AnswerGradingRepository {
    private val auth = FirebaseAuth.getInstance()

    init {
        require(FirebaseBackend.isAvailable(context)) { "Firebase 설정을 찾을 수 없습니다." }
    }

    override fun grade(request: GradeAnswerRequest, callback: (Result<GradeAnswerResult>) -> Unit) {
        val user = auth.currentUser
        if (user == null) {
            callback(Result.failure(IllegalStateException("AI 채점은 Firebase 로그인 후 사용할 수 있습니다.")))
            return
        }

        user.getIdToken(false)
            .addOnSuccessListener { token ->
                Thread {
                    runCatching {
                        postGradeRequest(request, token.token.orEmpty())
                    }
                        .onSuccess { callback(Result.success(it)) }
                        .onFailure { callback(Result.failure(it)) }
                }.start()
            }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    private fun postGradeRequest(request: GradeAnswerRequest, idToken: String): GradeAnswerResult {
        val word = request.word
        val correctAnswer = word.quizAnswers.firstOrNull() ?: word.quizKoreanBlank
        val payload = JSONObject()
            .put("english", word.exampleSentence)
            .put("korean", word.exampleTranslation.replace(word.quizKoreanBlank, "_____"))
            .put("targetWord", word.word)
            .put("wordMeaning", word.meaning)
            .put("acceptableAnswers", JSONArray(word.quizAnswers.ifEmpty { listOf(word.quizKoreanBlank) }))
            .put("correctAnswer", correctAnswer)
            .put("userAnswer", request.userAnswer.trim())

        val connection = (URL(FUNCTION_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 8000
            readTimeout = 12000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Origin", "https://hsmocap-d907e.web.app")
            setRequestProperty("Authorization", "Bearer $idToken")
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
            throw IllegalStateException(JSONObject(body.ifBlank { "{}" }).optString("error", "AI 채점 요청 실패: HTTP $code"))
        }

        val json = JSONObject(body)
        return GradeAnswerResult(
            isCorrect = json.optBoolean("isCorrect", false),
            verdict = json.optString("verdict", "incorrect"),
            message = json.optString("message", "채점 결과를 확인했습니다."),
            hint = json.optString("hint").takeIf { it.isNotBlank() },
        )
    }

    companion object {
        private const val FUNCTION_URL = "https://asia-northeast3-hsmocap-d907e.cloudfunctions.net/gradeWordAnswerHttpV3"
    }
}

class LocalAnswerGradingRepository : AnswerGradingRepository {
    override fun grade(request: GradeAnswerRequest, callback: (Result<GradeAnswerResult>) -> Unit) {
        val correct = request.word.acceptsAnswer(request.userAnswer)
        val correctAnswer = request.word.quizAnswers.firstOrNull() ?: request.word.quizKoreanBlank
        callback(
            Result.success(
                GradeAnswerResult(
                    isCorrect = correct,
                    verdict = if (correct) "correct" else "incorrect",
                    message = if (correct) "정답입니다." else "오답입니다.",
                    hint = if (correct) null else "정답: $correctAnswer",
                ),
            ),
        )
    }
}
