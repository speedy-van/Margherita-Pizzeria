package uk.margheritapizzeria.admin.fcm

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall

class DevicesRepository(private val api: DevicesApi) {
    suspend fun register(token: String): ApiResult<DeviceRegistration> =
        apiCall { api.register(RegisterDeviceRequest(token = token, platform = "android")) }

    suspend fun unregister(token: String): ApiResult<Map<String, Boolean>> =
        apiCall { api.unregister(UnregisterDeviceRequest(token = token)) }
}
