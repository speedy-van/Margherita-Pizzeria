package uk.margheritapizzeria.admin.auth.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall
import uk.margheritapizzeria.admin.core.session.SessionManager

class AuthRepository(
    private val api: AuthApi,
    private val sessionManager: SessionManager,
) {
    suspend fun signIn(email: String, password: String): ApiResult<LoginUser> {
        val trimmedEmail = email.trim().lowercase()
        return when (val result = apiCall { api.login(LoginRequest(trimmedEmail, password)) }) {
            is ApiResult.Success -> {
                val data = result.data
                sessionManager.signIn(
                    token = data.token,
                    userId = data.user.id,
                    email = data.user.email,
                    role = data.user.role,
                )
                ApiResult.Success(data.user)
            }
            is ApiResult.Failure -> result
        }
    }

    suspend fun loadMe(): ApiResult<LoginUser> {
        return when (val result = apiCall { api.me() }) {
            is ApiResult.Success -> ApiResult.Success(result.data.user)
            is ApiResult.Failure -> result
        }
    }

    suspend fun signOut() {
        runCatching { api.logout() }
        sessionManager.signOutLocal()
    }

    suspend fun requestPasswordReset(email: String): ApiResult<ForgotPasswordResponse> {
        val trimmedEmail = email.trim().lowercase()
        return apiCall { api.forgotPassword(ForgotPasswordRequest(trimmedEmail)) }
    }
}
