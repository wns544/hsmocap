package com.hsmocap.app.auth

import android.content.Context
import android.util.Patterns
import java.security.MessageDigest

class LocalAuthService(context: Context) : AuthService {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    override val currentUser: AuthUser?
        get() {
            val id = prefs.getString(KEY_ID, null) ?: return null
            return AuthUser(
                id = id,
                displayName = prefs.getString(KEY_DISPLAY_NAME, null) ?: "워디 사용자",
                email = prefs.getString(KEY_EMAIL, null),
                isGuest = prefs.getBoolean(KEY_IS_GUEST, false),
            )
        }

    override fun signInWithEmail(email: String, password: String): AuthUser {
        val normalizedEmail = normalizeEmail(email)
        require(normalizedEmail.isNotBlank() && password.isNotBlank()) { "이메일과 비밀번호를 입력하세요." }
        require(isValidEmail(normalizedEmail)) { "이메일 형식이 올바르지 않습니다." }
        require(prefs.contains(accountPasswordKey(normalizedEmail))) { "가입되지 않은 이메일입니다. 이메일 계정 만들기를 먼저 진행해 주세요." }
        require(passwordMatches(normalizedEmail, password)) { "이메일 또는 비밀번호가 올바르지 않습니다." }
        return save(
            AuthUser(
                id = accountId(normalizedEmail),
                displayName = normalizedEmail.substringBefore("@").ifBlank { "워디 사용자" },
                email = normalizedEmail,
            ),
        )
    }

    override fun signUpWithEmail(email: String, password: String): AuthUser {
        val normalizedEmail = normalizeEmail(email)
        require(normalizedEmail.isNotBlank() && password.isNotBlank()) { "이메일과 비밀번호를 입력하세요." }
        require(isValidEmail(normalizedEmail)) { "이메일 형식이 올바르지 않습니다." }
        require(password.length >= 6) { "비밀번호는 6자 이상이어야 합니다." }
        require(!prefs.contains(accountPasswordKey(normalizedEmail))) { "이미 가입된 이메일입니다. 로그인으로 계속해 주세요." }

        prefs.edit()
            .putString(accountPasswordKey(normalizedEmail), passwordHash(password))
            .apply()

        return save(
            AuthUser(
                id = accountId(normalizedEmail),
                displayName = normalizedEmail.substringBefore("@").ifBlank { "워디 사용자" },
                email = normalizedEmail,
            ),
        )
    }

    override fun signInWithGoogleIdToken(idToken: String): AuthUser {
        require(idToken.isNotBlank()) { "Google 로그인 토큰을 찾을 수 없습니다." }
        throw IllegalStateException("Google 로그인은 Firebase 설정 후 사용할 수 있습니다.")
    }

    override fun signInAsGuest(): AuthUser {
        return save(
            AuthUser(
                id = "local-guest",
                displayName = "워디 사용자",
                isGuest = true,
            ),
        )
    }

    override fun updateDisplayName(displayName: String): AuthUser {
        val normalizedName = displayName.trim()
        require(normalizedName.isNotBlank()) { "닉네임을 입력해 주세요." }
        require(normalizedName.length <= 20) { "닉네임은 20자 이하로 입력해 주세요." }
        val current = requireNotNull(currentUser) { "로그인이 필요합니다." }
        return save(current.copy(displayName = normalizedName))
    }

    override fun signOut() {
        prefs.edit()
            .remove(KEY_ID)
            .remove(KEY_DISPLAY_NAME)
            .remove(KEY_EMAIL)
            .remove(KEY_IS_GUEST)
            .apply()
    }

    private fun save(user: AuthUser): AuthUser {
        prefs.edit()
            .putString(KEY_ID, user.id)
            .putString(KEY_DISPLAY_NAME, user.displayName)
            .putString(KEY_EMAIL, user.email)
            .putBoolean(KEY_IS_GUEST, user.isGuest)
            .apply()
        return user
    }

    private fun normalizeEmail(email: String): String = email.trim().replace("%40", "@").lowercase()

    private fun isValidEmail(email: String): Boolean = Patterns.EMAIL_ADDRESS.matcher(email).matches()

    private fun accountId(email: String): String = "local-email-$email"

    private fun accountPasswordKey(email: String): String = "account_password.$email"

    private fun passwordMatches(email: String, password: String): Boolean {
        val stored = prefs.getString(accountPasswordKey(email), null) ?: return false
        val nextHash = passwordHash(password)
        if (stored == nextHash) return true

        // Migrate older local fallback accounts that were created before hashing.
        if (stored == password) {
            prefs.edit()
                .putString(accountPasswordKey(email), nextHash)
                .apply()
            return true
        }
        return false
    }

    private fun passwordHash(password: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(password.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { byte -> "%02x".format(byte) }
    }

    companion object {
        private const val PREFS_NAME = "hsmocap_native_auth"
        private const val KEY_ID = "id"
        private const val KEY_DISPLAY_NAME = "display_name"
        private const val KEY_EMAIL = "email"
        private const val KEY_IS_GUEST = "is_guest"
    }
}
