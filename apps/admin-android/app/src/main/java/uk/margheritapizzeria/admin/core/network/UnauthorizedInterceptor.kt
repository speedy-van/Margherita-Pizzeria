package uk.margheritapizzeria.admin.core.network

import okhttp3.Interceptor
import okhttp3.Response
import uk.margheritapizzeria.admin.core.session.SessionManager

/**
 * Listens for 401 responses on admin endpoints (except the login route)
 * and clears the local session. The interceptor never logs the response
 * body or any header values.
 */
class UnauthorizedInterceptor(private val session: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)
        if (response.code == 401) {
            val path = request.url.encodedPath
            if (!path.endsWith("/api/mobile/admin/login")) {
                session.onUnauthorized()
            }
        }
        return response
    }
}
