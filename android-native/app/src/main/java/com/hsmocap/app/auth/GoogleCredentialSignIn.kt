package com.hsmocap.app.auth

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Handler
import android.os.CancellationSignal
import android.os.Looper
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import java.util.concurrent.atomic.AtomicBoolean

object GoogleCredentialSignIn {
    private const val TAG = "WordyGoogleSignIn"
    private const val CREDENTIAL_TIMEOUT_MS = 12_000L
    const val LEGACY_SIGN_IN_REQUEST = 7301
    private var pendingSuccess: ((String) -> Unit)? = null
    private var pendingFailure: ((String) -> Unit)? = null

    fun requestIdToken(
        activity: Activity,
        onSuccess: (String) -> Unit,
        onFailure: (String) -> Unit,
    ) {
        val clientId = activity.defaultWebClientId()
        if (clientId.isNullOrBlank()) {
            Log.e(TAG, "default_web_client_id is missing")
            onFailure("Firebase Google 로그인 설정을 찾을 수 없습니다.")
            return
        }

        Log.d(TAG, "Requesting Google ID token with clientId=${clientId.take(12)}...")
        val credentialManager = CredentialManager.create(activity)
        val googleIdOption = GetGoogleIdOption.Builder()
            .setServerClientId(clientId)
            .setFilterByAuthorizedAccounts(false)
            .setAutoSelectEnabled(false)
            .build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()
        val cancellationSignal = CancellationSignal()
        val completed = AtomicBoolean(false)
        val mainHandler = Handler(Looper.getMainLooper())
        val timeoutRunnable = Runnable {
            if (completed.compareAndSet(false, true)) {
                Log.e(TAG, "Credential request timed out")
                cancellationSignal.cancel()
                startLegacySignIn(activity, clientId, onSuccess, onFailure)
            }
        }
        mainHandler.postDelayed(timeoutRunnable, CREDENTIAL_TIMEOUT_MS)

        credentialManager.getCredentialAsync(
            context = activity,
            request = request,
            cancellationSignal = cancellationSignal,
            executor = activity.mainExecutor,
            callback = object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
                override fun onResult(result: GetCredentialResponse) {
                    if (!completed.compareAndSet(false, true)) return
                    mainHandler.removeCallbacks(timeoutRunnable)
                    val credential = result.credential
                    Log.d(TAG, "Credential result type=${credential.type}")
                    if (
                        credential is CustomCredential &&
                        credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                    ) {
                        runCatching { GoogleIdTokenCredential.createFrom(credential.data).idToken }
                            .onSuccess {
                                Log.d(TAG, "Google ID token received")
                                onSuccess(it)
                            }
                            .onFailure {
                                Log.e(TAG, "Failed to parse Google credential", it)
                                onFailure("Google 로그인 정보를 읽지 못했습니다. (${it.javaClass.simpleName})")
                            }
                    } else {
                        Log.e(TAG, "Unexpected credential response: ${credential.type}")
                        onFailure("Google 로그인 응답 형식이 올바르지 않습니다.")
                    }
                }

                override fun onError(e: GetCredentialException) {
                    if (!completed.compareAndSet(false, true)) return
                    mainHandler.removeCallbacks(timeoutRunnable)
                    Log.e(TAG, "Credential request failed: ${e.javaClass.simpleName}: ${e.message}", e)
                    if (e is NoCredentialException) {
                        onFailure("사용 가능한 Google 계정을 찾을 수 없습니다.")
                    } else {
                        startLegacySignIn(activity, clientId, onSuccess, onFailure)
                    }
                }
            },
        )
    }

    fun handleActivityResult(requestCode: Int, data: Intent?): Boolean {
        if (requestCode != LEGACY_SIGN_IN_REQUEST) return false
        val onSuccess = pendingSuccess
        val onFailure = pendingFailure
        pendingSuccess = null
        pendingFailure = null
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
        onFailure: (String) -> Unit,
    ) {
        Log.d(TAG, "Starting legacy Google sign-in fallback")
        pendingSuccess = onSuccess
        pendingFailure = onFailure
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(clientId)
            .requestEmail()
            .build()
        val client = GoogleSignIn.getClient(activity, options)
        activity.startActivityForResult(client.signInIntent, LEGACY_SIGN_IN_REQUEST)
    }

    @SuppressLint("DiscouragedApi")
    private fun Activity.defaultWebClientId(): String? {
        val resourceId = resources.getIdentifier("default_web_client_id", "string", packageName)
        if (resourceId == 0) return null
        return runCatching { getString(resourceId) }.getOrNull()
    }
}
