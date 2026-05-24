package uk.margheritapizzeria.admin.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Standard envelope returned by every Margherita admin API route:
 *   { "ok": true,  "data":  <T> }
 *   { "ok": false, "error": { "code": "...", "message": "...", "fields"?: {...} } }
 */
@Serializable
data class ApiEnvelope<T>(
    val ok: Boolean = false,
    val data: T? = null,
    val error: ApiError? = null,
)

@Serializable
data class ApiError(
    val code: String = "UNKNOWN",
    val message: String = "Something went wrong.",
    @SerialName("fields")
    val fields: Map<String, String>? = null,
)
