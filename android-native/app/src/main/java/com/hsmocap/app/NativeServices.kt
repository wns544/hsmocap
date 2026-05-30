package com.hsmocap.app

import android.content.Context
import com.hsmocap.app.auth.AuthService
import com.hsmocap.app.auth.FirebaseAuthService
import com.hsmocap.app.auth.LocalAuthService
import com.hsmocap.app.data.CommunityRepository
import com.hsmocap.app.data.AppDatabase
import com.hsmocap.app.data.AnswerGradingRepository
import com.hsmocap.app.data.CachedCommunityRepository
import com.hsmocap.app.data.CachedReadOnlyCommunityRepository
import com.hsmocap.app.data.FirebaseCommunityRepository
import com.hsmocap.app.data.FirebaseStudyStore
import com.hsmocap.app.data.FirebaseWordRepository
import com.hsmocap.app.data.FirebaseImageUploadRepository
import com.hsmocap.app.data.FirebaseFunctionAnswerGradingRepository
import com.hsmocap.app.data.FirebaseFunctionImageHintRepository
import com.hsmocap.app.data.FeedbackRepository
import com.hsmocap.app.data.FirebaseFeedbackRepository
import com.hsmocap.app.data.ImageUploadRepository
import com.hsmocap.app.data.ImageHintRepository
import com.hsmocap.app.data.LocalFeedbackRepository
import com.hsmocap.app.data.LocalAnswerGradingRepository
import com.hsmocap.app.data.RoomStudyStore
import com.hsmocap.app.data.RoomWordRepository
import com.hsmocap.app.data.SeedWordRepository
import com.hsmocap.app.data.StudyStore
import com.hsmocap.app.data.UnavailableCommunityRepository
import com.hsmocap.app.data.UnavailableImageHintRepository
import com.hsmocap.app.data.UnavailableImageUploadRepository
import com.hsmocap.app.data.WordRepository
import com.hsmocap.app.firebase.FirebaseBackend
import com.hsmocap.app.firebase.FirebaseStatus

object NativeServices {
    fun auth(context: Context): AuthService {
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseAuthService(context)
        } else {
            LocalAuthService(context)
        }
    }

    fun studyStore(
        context: Context,
        userId: String,
        onRemoteChanged: () -> Unit = {},
    ): StudyStore {
        val database = AppDatabase.get(context)
        val local = RoomStudyStore(
            stateDao = database.studyStateDao(),
            pendingActionDao = database.pendingActionDao(),
            syncMetadataDao = database.syncMetadataDao(),
            userId = userId,
        )
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseStudyStore(local, userId, onRemoteChanged)
        } else {
            local
        }
    }

    fun communityRepository(context: Context): CommunityRepository {
        val database = AppDatabase.get(context)
        val postCache = database.communityPostDao()
        val commentCache = database.communityCommentDao()
        return if (FirebaseBackend.isAvailable(context)) {
            CachedCommunityRepository(
                remote = FirebaseCommunityRepository(context),
                postCache = postCache,
                commentCache = commentCache,
            )
        } else {
            CachedReadOnlyCommunityRepository(postCache, commentCache)
        }
    }

    fun imageUploadRepository(context: Context): ImageUploadRepository {
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseImageUploadRepository(context)
        } else {
            UnavailableImageUploadRepository()
        }
    }

    fun answerGradingRepository(context: Context): AnswerGradingRepository {
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseFunctionAnswerGradingRepository(context)
        } else {
            LocalAnswerGradingRepository()
        }
    }

    fun imageHintRepository(context: Context): ImageHintRepository {
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseFunctionImageHintRepository(context)
        } else {
            UnavailableImageHintRepository()
        }
    }

    fun feedbackRepository(context: Context): FeedbackRepository {
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseFeedbackRepository(context)
        } else {
            LocalFeedbackRepository()
        }
    }

    fun wordRepository(context: Context): WordRepository {
        val dao = AppDatabase.get(context).wordDao()
        val metadata = AppDatabase.get(context).syncMetadataDao()
        val local = RoomWordRepository(
            dao = dao,
            syncMetadataDao = metadata,
            seed = SeedWordRepository(context),
        )
        return if (FirebaseBackend.isAvailable(context)) {
            FirebaseWordRepository(dao, metadata, local)
        } else {
            local
        }
    }

    fun backendStatus(context: Context): FirebaseStatus {
        return FirebaseBackend.status(context)
    }
}
