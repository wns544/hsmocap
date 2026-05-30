package com.hsmocap.app.firebase

import android.annotation.SuppressLint
import android.content.Context
import com.google.firebase.FirebaseApp

object FirebaseBackend {
    fun isAvailable(context: Context): Boolean {
        if (!hasGoogleServicesConfig(context)) return false

        return runCatching {
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
            }
            FirebaseApp.getApps(context).isNotEmpty()
        }.getOrDefault(false)
    }

    @SuppressLint("DiscouragedApi")
    fun status(context: Context): FirebaseStatus {
        val configLoaded = hasGoogleServicesConfig(context)
        val available = isAvailable(context)
        val webClientId = context.resources.getIdentifier("default_web_client_id", "string", context.packageName)
            .takeIf { it != 0 }
            ?.let { resourceId -> runCatching { context.getString(resourceId) }.getOrNull() }
            .orEmpty()
        val diagnostics = buildList {
            add(if (configLoaded) "설정 파일 감지됨" else "설정 파일 없음")
            add(if (available) "Firebase 초기화됨" else "Firebase 초기화 대기")
            add(if (webClientId.isNotBlank()) "Web client ID 있음" else "Web client ID 없음")
        }
        return FirebaseStatus(
            mode = if (available) BackendMode.Firebase else BackendMode.LocalFallback,
            googleServicesLoaded = configLoaded,
            googleSignInReady = available && webClientId.isNotBlank(),
            message = if (available) {
                "Firebase Auth/Firestore 사용 중"
            } else {
                "로컬 저장소 사용 중 · google-services.json 필요"
            },
            diagnostics = diagnostics,
        )
    }

    private fun hasGoogleServicesConfig(context: Context): Boolean {
        val googleAppId = context.stringResource("google_app_id")
        val projectId = context.stringResource("project_id")
        return googleAppId.isNotBlank() || projectId.isNotBlank()
    }

    @SuppressLint("DiscouragedApi")
    private fun Context.stringResource(name: String): String {
        return resources.getIdentifier(name, "string", packageName)
            .takeIf { it != 0 }
            ?.let { resourceId -> runCatching { getString(resourceId) }.getOrNull() }
            .orEmpty()
    }
}

enum class BackendMode {
    Firebase,
    LocalFallback,
}

data class FirebaseStatus(
    val mode: BackendMode,
    val googleServicesLoaded: Boolean,
    val googleSignInReady: Boolean,
    val message: String,
    val diagnostics: List<String>,
)
