package com.hsmocap.app.auth

import android.annotation.SuppressLint
import android.app.Activity
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
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import java.util.concurrent.atomic.AtomicBoolean

object GoogleCredentialSignIn {
    private const val TAG = "WordyGoogleSignIn"
    private const val CREDENTIAL_TIMEOUT_MS = 12_000L

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
                onFailure("Google 로그인 응답이 지연되고 있습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.")
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
                    val message = if (e is NoCredentialException) {
                        "사용 가능한 Google 계정을 찾을 수 없습니다."
                    } else {
                        e.localizedMessage ?: "Google 로그인에 실패했습니다. (${e.javaClass.simpleName})"
                    }
                    onFailure(message)
                }
            },
        )
    }

    @SuppressLint("DiscouragedApi")
    private fun Activity.defaultWebClientId(): String? {
        val resourceId = resources.getIdentifier("default_web_client_id", "string", packageName)
        if (resourceId == 0) return null
        return runCatching { getString(resourceId) }.getOrNull()
    }
}
