package uk.margheritapizzeria.admin.fcm

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.HTTP
import retrofit2.http.POST
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import kotlinx.serialization.Serializable

@Serializable
data class RegisterDeviceRequest(
    val token: String,
    val platform: String = "android",
)

@Serializable
data class UnregisterDeviceRequest(val token: String)

@Serializable
data class DeviceRegistration(val token: String)

interface DevicesApi {
    @POST("api/mobile/admin/devices/register")
    suspend fun register(
        @Body body: RegisterDeviceRequest,
    ): Response<ApiEnvelope<DeviceRegistration>>

    @HTTP(method = "DELETE", path = "api/mobile/admin/devices/register", hasBody = true)
    suspend fun unregister(
        @Body body: UnregisterDeviceRequest,
    ): Response<ApiEnvelope<Map<String, Boolean>>>
}
