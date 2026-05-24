package uk.margheritapizzeria.admin.core.network

import okhttp3.Interceptor
import okhttp3.Response
import uk.margheritapizzeria.admin.core.session.SessionManager

/**
 * Attaches `Authorization: Bearer <token>` when a token is available and
 * the caller has not already provided one. Skips the login endpoint so
 * sign-in requests don't echo a stale token.
 */
class AuthInterceptor(private val session: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val path = original.url.encodedPath
        if (path.endsWith("/api/mobile/admin/login")) {
            return chain.proceed(original)
        }
        if (original.header("Authorization") != null) {
            return chain.proceed(original)
        }
        val token = session.currentToken
        val request = if (!token.isNullOrBlank()) {
            original.newBuilder().header("Authorization", "Bearer $token").build()
        } else {
            original
        }
        return chain.proceed(request)
    }
}
