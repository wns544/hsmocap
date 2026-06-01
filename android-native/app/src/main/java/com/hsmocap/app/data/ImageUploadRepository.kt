package com.hsmocap.app.data

import android.content.Context
import android.net.Uri
import com.google.firebase.storage.StorageMetadata
import com.google.firebase.storage.FirebaseStorage
import com.hsmocap.app.firebase.FirebaseBackend
import java.util.UUID

interface ImageUploadRepository {
    fun uploadCommunityImage(userId: String, imageUri: Uri, callback: (Result<String>) -> Unit)
}

class FirebaseImageUploadRepository(context: Context) : ImageUploadRepository {
    private val appContext = context.applicationContext
    private val storage = FirebaseStorage.getInstance().reference

    init {
        require(FirebaseBackend.isAvailable(context)) { "Firebase 설정을 찾을 수 없습니다." }
    }

    override fun uploadCommunityImage(userId: String, imageUri: Uri, callback: (Result<String>) -> Unit) {
        val path = "communityPosts/$userId/${System.currentTimeMillis()}-${UUID.randomUUID()}.jpg"
        val ref = storage.child(path)
        val metadata = StorageMetadata.Builder()
            .setContentType(appContext.contentResolver.getType(imageUri) ?: "image/jpeg")
            .build()
        ref.putFile(imageUri, metadata)
            .continueWithTask { task ->
                task.exception?.let { throw it }
                ref.downloadUrl
            }
            .addOnSuccessListener { uri -> callback(Result.success(uri.toString())) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }
}

class UnavailableImageUploadRepository : ImageUploadRepository {
    private val error = IllegalStateException("Firebase Storage 연결이 필요합니다.")

    override fun uploadCommunityImage(userId: String, imageUri: Uri, callback: (Result<String>) -> Unit) {
        callback(Result.failure(error))
    }
}
