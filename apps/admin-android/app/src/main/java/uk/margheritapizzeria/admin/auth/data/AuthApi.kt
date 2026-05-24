package uk.margheritapizzeria.admin.auth.data

import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import uk.margheritapizzeria.admin.core.network.ApiEnvelope

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class LoginUser(val id: String, val email: String, val role: String)

@Serializable
data class LoginResponse(
    val token: String,
    val expiresAt: String? = null,
    val user: LoginUser,
)

@Serializable
data class MeResponse(val user: LoginUser)

@Serializable
data class ForgotPasswordRequest(val email: String)

@Serializable
data class ForgotPasswordResponse(val message: String? = null)

interface AuthApi {
    @POST("api/mobile/admin/login")
    suspend fun login(@Body body: LoginRequest): Response<ApiEnvelope<LoginResponse>>

    @GET("api/mobile/admin/me")
    suspend fun me(): Response<ApiEnvelope<MeResponse>>

    @POST("api/mobile/admin/logout")
    suspend fun logout(): Response<ApiEnvelope<Map<String, Boolean>>>

    @POST("api/mobile/admin/auth/forgot-password")
    suspend fun forgotPassword(
        @Body body: ForgotPasswordRequest,
    ): Response<ApiEnvelope<ForgotPasswordResponse>>
}
