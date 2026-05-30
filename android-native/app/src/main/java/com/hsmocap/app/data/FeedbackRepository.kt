package com.hsmocap.app.data

import android.content.Context
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.hsmocap.app.auth.AuthUser
import com.hsmocap.app.firebase.FirebaseBackend

data class CreateFeedbackRequest(
    val user: AuthUser,
    val categoryId: String,
    val categoryName: String,
    val title: String,
    val body: String,
    val isImportant: Boolean,
)

interface FeedbackRepository {
    fun createFeedback(request: CreateFeedbackRequest, callback: (Result<String>) -> Unit)
}

class FirebaseFeedbackRepository(context: Context) : FeedbackRepository {
    private val db = FirebaseFirestore.getInstance()

    init {
        require(FirebaseBackend.isAvailable(context)) { "Firebase 설정을 찾을 수 없습니다." }
    }

    override fun createFeedback(request: CreateFeedbackRequest, callback: (Result<String>) -> Unit) {
        val title = request.title.trim()
        val body = request.body.trim()
        require(title.isNotBlank()) { "제목을 입력하세요." }
        require(body.isNotBlank()) { "내용을 입력하세요." }

        db.collection("feedbacks")
            .add(
                mapOf(
                    "userId" to request.user.id,
                    "authorSnapshot" to mapOf(
                        "name" to request.user.displayName.ifBlank { request.user.email ?: "워디 사용자" },
                        "email" to request.user.email.orEmpty(),
                    ),
                    "categoryId" to request.categoryId,
                    "categoryName" to request.categoryName,
                    "title" to title,
                    "body" to body,
                    "isImportant" to request.isImportant,
                    "imageUrls" to emptyList<String>(),
                    "status" to "open",
                    "createdAt" to Timestamp.now(),
                    "updatedAt" to Timestamp.now(),
                ),
            )
            .addOnSuccessListener { ref -> callback(Result.success(ref.id)) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }
}

class LocalFeedbackRepository : FeedbackRepository {
    override fun createFeedback(request: CreateFeedbackRequest, callback: (Result<String>) -> Unit) {
        val title = request.title.trim()
        val body = request.body.trim()
        require(title.isNotBlank()) { "제목을 입력하세요." }
        require(body.isNotBlank()) { "내용을 입력하세요." }
        callback(Result.success("local-${System.currentTimeMillis()}"))
    }
}
