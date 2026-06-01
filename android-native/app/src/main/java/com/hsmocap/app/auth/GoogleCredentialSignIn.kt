package com.hsmocap.app.auth

import android.annotation.SuppressLint
import android.app.Activity
import android.os.CancellationSignal
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

object GoogleCredentialSignIn {
    private const val TAG = "WordyGoogleSignIn"

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

        credentialManager.getCredentialAsync(
            context = activity,
            request = request,
            cancellationSignal = CancellationSignal(),
            executor = activity.mainExecutor,
            callback = object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
                override fun onResult(result: GetCredentialResponse) {
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
