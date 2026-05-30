package com.hsmocap.app.auth

import android.content.Context
import com.hsmocap.app.firebase.FirebaseBackend
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
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
        require(normalizedEmail.isNotBlank() && password.isNotBlank()) { "이메일과 비밀번호를 입력하세요." }
        require(normalizedEmail.contains("@")) { "올바른 이메일 형식으로 입력하세요." }
        require(password.length >= 6) { "비밀번호는 6자 이상이어야 합니다." }

        val result = Tasks.await(
            auth.createUserWithEmailAndPassword(normalizedEmail, password),
            AUTH_TIMEOUT_SECONDS,
            TimeUnit.SECONDS,
        )
        return requireNotNull(result.user).toAuthUser()
    }

    override fun signInWithEmail(email: String, password: String): AuthUser {
        val normalizedEmail = normalizeEmail(email)
        require(normalizedEmail.isNotBlank() && password.isNotBlank()) { "이메일과 비밀번호를 입력하세요." }

        val result = Tasks.await(
            auth.signInWithEmailAndPassword(normalizedEmail, password),
            AUTH_TIMEOUT_SECONDS,
            TimeUnit.SECONDS,
        )
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
        val result = Tasks.await(
            auth.signInAnonymously(),
            AUTH_TIMEOUT_SECONDS,
            TimeUnit.SECONDS,
        )
        return requireNotNull(result.user).toAuthUser()
    }

    override fun signOut() {
        auth.signOut()
    }

    private fun normalizeEmail(email: String): String = email.trim().replace("%40", "@").lowercase()

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
                ?: if (isAnonymous) "게스트" else "워디 사용자",
            email = resolvedEmail,
            isGuest = isAnonymous,
            isAdmin = admin,
        )
    }

    companion object {
        private const val AUTH_TIMEOUT_SECONDS = 15L
        private val ADMIN_BOOTSTRAP_UIDS = setOf("xezvVnR7d2YmSXTqSatGzUBLGxI3")
    }
}
