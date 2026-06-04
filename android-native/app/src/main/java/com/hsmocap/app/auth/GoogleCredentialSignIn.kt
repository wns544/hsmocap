package com.hsmocap.app.auth

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

object GoogleCredentialSignIn {
    private const val TAG = "WordyGoogleSignIn"
    const val LEGACY_SIGN_IN_REQUEST = 7301
    private var pendingSuccess: ((String) -> Unit)? = null
    private var pendingFailure: ((String) -> Unit)? = null
    private var pendingCanceled: (() -> Unit)? = null

    fun requestIdToken(
        activity: Activity,
        onSuccess: (String) -> Unit,
        onFailure: (String) -> Unit,
        onCanceled: () -> Unit,
    ) {
        val clientId = activity.defaultWebClientId()
        if (clientId.isNullOrBlank()) {
            Log.e(TAG, "default_web_client_id is missing")
            onFailure("Firebase Google 로그인 설정을 찾을 수 없습니다.")
            return
        }

        Log.d(TAG, "Starting legacy Google ID token request first")
        startLegacySignIn(activity, clientId, onSuccess, onCanceled) { message ->
            Log.e(TAG, "Legacy Google sign-in failed to start: $message")
            onFailure(message)
        }
    }

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
        if (requestCode != LEGACY_SIGN_IN_REQUEST) return false
        val onSuccess = pendingSuccess
        val onFailure = pendingFailure
        val onCanceled = pendingCanceled
        pendingSuccess = null
        pendingFailure = null
        pendingCanceled = null
        if (resultCode == Activity.RESULT_CANCELED) {
            Log.d(TAG, "Legacy Google sign-in canceled")
            onCanceled?.invoke()
            return true
        }
        runCatching {
            val account = GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException::class.java)
            requireNotNull(account.idToken) { "Google 로그인 토큰을 찾을 수 없습니다." }
        }.onSuccess { idToken ->
            Log.d(TAG, "Legacy Google ID token received")
            onSuccess?.invoke(idToken)
        }.onFailure { error ->
            Log.e(TAG, "Legacy Google sign-in failed", error)
            val message = (error as? ApiException)?.let {
                "Google 로그인에 실패했습니다. (${it.statusCode})"
            } ?: (error.localizedMessage ?: "Google 로그인에 실패했습니다.")
            onFailure?.invoke(message)
        }
        return true
    }

    private fun startLegacySignIn(
        activity: Activity,
        clientId: String,
        onSuccess: (String) -> Unit,
        onCanceled: () -> Unit,
        onFailure: (String) -> Unit,
    ) {
        Log.d(TAG, "Starting legacy Google sign-in")
        pendingSuccess = onSuccess
        pendingFailure = onFailure
        pendingCanceled = onCanceled
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(clientId)
            .requestEmail()
            .build()
        val client = GoogleSignIn.getClient(activity, options)
        runCatching {
            activity.startActivityForResult(client.signInIntent, LEGACY_SIGN_IN_REQUEST)
        }.onFailure { error ->
            pendingSuccess = null
            pendingFailure = null
            pendingCanceled = null
            onFailure(error.localizedMessage ?: "Google 로그인 화면을 열 수 없습니다.")
        }
    }

    @SuppressLint("DiscouragedApi")
    private fun Activity.defaultWebClientId(): String? {
        val resourceId = resources.getIdentifier("default_web_client_id", "string", packageName)
        if (resourceId == 0) return null
        return runCatching { getString(resourceId) }.getOrNull()
    }
}
