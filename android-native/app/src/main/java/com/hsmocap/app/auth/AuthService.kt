package com.hsmocap.app.auth

interface AuthService {
    val currentUser: AuthUser?

    fun signUpWithEmail(email: String, password: String): AuthUser
    fun signInWithEmail(email: String, password: String): AuthUser
    fun signInWithGoogleIdToken(idToken: String): AuthUser
    fun signInAsGuest(): AuthUser
    fun signOut()
}

data class AuthUser(
    val id: String,
    val displayName: String,
    val email: String? = null,
    val isGuest: Boolean = false,
    val isAdmin: Boolean = false,
)
