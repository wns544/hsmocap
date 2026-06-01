package com.hsmocap.app.auth

import android.content.Context
import android.util.Log
import android.util.Patterns
import com.hsmocap.app.firebase.FirebaseBackend
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import java.util.concurrent.TimeUnit

class FirebaseAuthService(context: Context) : AuthService {
    private val auth: FirebaseAuth

    init {
        require(FirebaseBackend.isAvailable(context)) { "Firebase 설정을 찾을 수 없습니다." }
        auth = FirebaseAuth.getInstance()
    }

    override val currentUser: AuthUser?
        get() = auth.currentUser?.toAuthUser()

    override fun signUpWithEmail(email: String, password: String): AuthUser {
        val normalizedEmail = normalizeEmail(email)
        Log.d(TAG, "signUpWithEmail start email=${maskEmail(normalizedEmail)}")
        require(normalizedEmail.isNotBlank() && password.isNotBlank()) { "이메일과 비밀번호를 입력하세요." }
        require(isValidEmail(normalizedEmail)) { "이메일 형식이 올바르지 않습니다." }
        require(password.length >= 6) { "비밀번호는 6자 이상이어야 합니다." }

        val result = runCatching {
            Tasks.await(
                auth.createUserWithEmailAndPassword(normalizedEmail, password),
                AUTH_TIMEOUT_SECONDS,
                TimeUnit.SECONDS,
            )
        }.getOrElse { error ->
            throw mapEmailSignUpError(error)
        }
        return requireNotNull(result.user).toAuthUser()
    }

    override fun signInWithEmail(email: String, password: String): AuthUser {
        val normalizedEmail = normalizeEmail(email)
        Log.d(TAG, "signInWithEmail start email=${maskEmail(normalizedEmail)}")
        require(normalizedEmail.isNotBlank() && password.isNotBlank()) { "이메일과 비밀번호를 입력하세요." }
        require(isValidEmail(normalizedEmail)) { "이메일 형식이 올바르지 않습니다." }

        val result = runCatching {
            Tasks.await(
                auth.signInWithEmailAndPassword(normalizedEmail, password),
                AUTH_TIMEOUT_SECONDS,
                TimeUnit.SECONDS,
            )
        }.getOrElse { error ->
            throw mapEmailLoginError(error)
        }
        return requireNotNull(result.user).toAuthUser()
    }

    override fun signInWithGoogleIdToken(idToken: String): AuthUser {
        require(idToken.isNotBlank()) { "Google 로그인 토큰을 찾을 수 없습니다." }
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val result = Tasks.await(
            auth.signInWithCredential(credential),
            AUTH_TIMEOUT_SECONDS,
            TimeUnit.SECONDS,
        )
        return requireNotNull(result.user).toAuthUser()
    }

    override fun signInAsGuest(): AuthUser {
        Log.d(TAG, "signInAsGuest start")
        val result = Tasks.await(
            auth.signInAnonymously(),
            AUTH_TIMEOUT_SECONDS,
            TimeUnit.SECONDS,
        )
        return requireNotNull(result.user).toAuthUser()
    }

    override fun updateDisplayName(displayName: String): AuthUser {
        val normalizedName = displayName.trim()
        require(normalizedName.isNotBlank()) { "닉네임을 입력해 주세요." }
        require(normalizedName.length <= 20) { "닉네임은 20자 이하로 입력해 주세요." }
        val user = requireNotNull(auth.currentUser) { "로그인이 필요합니다." }
        val request = UserProfileChangeRequest.Builder()
            .setDisplayName(normalizedName)
            .build()
        Tasks.await(user.updateProfile(request), AUTH_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        Tasks.await(user.reload(), AUTH_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        return requireNotNull(auth.currentUser).toAuthUser()
    }

    override fun signOut() {
        auth.signOut()
    }

    private fun normalizeEmail(email: String): String = email.trim().replace("%40", "@").lowercase()

    private fun isValidEmail(email: String): Boolean = Patterns.EMAIL_ADDRESS.matcher(email).matches()

    private fun mapEmailLoginError(error: Throwable): Throwable {
        val cause = error.cause ?: error
        return when ((cause as? FirebaseAuthException)?.errorCode) {
            "ERROR_INVALID_EMAIL" -> IllegalStateException("이메일 형식이 올바르지 않습니다.", cause)
            "ERROR_USER_NOT_FOUND" -> IllegalStateException("가입되지 않은 이메일입니다. 이메일 계정 만들기를 먼저 진행해 주세요.", cause)
            "ERROR_WRONG_PASSWORD",
            "ERROR_INVALID_CREDENTIAL" -> IllegalStateException("이메일 또는 비밀번호가 올바르지 않습니다.", cause)
            "ERROR_TOO_MANY_REQUESTS" -> IllegalStateException("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", cause)
            "ERROR_NETWORK_REQUEST_FAILED" -> IllegalStateException("네트워크 연결을 확인해 주세요.", cause)
            else -> error
        }
    }

    private fun mapEmailSignUpError(error: Throwable): Throwable {
        val cause = error.cause ?: error
        return when ((cause as? FirebaseAuthException)?.errorCode) {
            "ERROR_EMAIL_ALREADY_IN_USE" -> IllegalStateException("이미 가입된 이메일입니다. 로그인으로 계속해 주세요.", cause)
            "ERROR_INVALID_EMAIL" -> IllegalStateException("이메일 형식이 올바르지 않습니다.", cause)
            "ERROR_WEAK_PASSWORD" -> IllegalStateException("비밀번호는 6자 이상이어야 합니다.", cause)
            "ERROR_TOO_MANY_REQUESTS" -> IllegalStateException("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", cause)
            "ERROR_NETWORK_REQUEST_FAILED" -> IllegalStateException("네트워크 연결을 확인해 주세요.", cause)
            else -> error
        }
    }

    private fun maskEmail(email: String): String {
        val at = email.indexOf('@')
        if (at <= 1) return "***"
        return "${email.first()}***${email.substring(at)}"
    }

    private fun FirebaseUser.toAuthUser(): AuthUser {
        val resolvedEmail = email
        val admin = runCatching {
            val token = Tasks.await(getIdToken(true), AUTH_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            token.claims["admin"] == true || ADMIN_BOOTSTRAP_UIDS.contains(uid)
        }.getOrDefault(ADMIN_BOOTSTRAP_UIDS.contains(uid))
        return AuthUser(
            id = uid,
            displayName = displayName
                ?: resolvedEmail?.substringBefore("@")?.ifBlank { null }
                ?: "워디 사용자",
            email = resolvedEmail,
            isGuest = isAnonymous,
            isAdmin = admin,
        )
    }

    companion object {
        private const val TAG = "WordyAuth"
        private const val AUTH_TIMEOUT_SECONDS = 15L
        private val ADMIN_BOOTSTRAP_UIDS = setOf("xezvVnR7d2YmSXTqSatGzUBLGxI3")
    }
}
