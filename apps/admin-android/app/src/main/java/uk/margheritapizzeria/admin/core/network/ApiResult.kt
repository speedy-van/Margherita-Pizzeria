package uk.margheritapizzeria.admin.core.network

/**
 * UI-friendly result type. Repositories convert raw network/envelope
 * outcomes into `ApiResult` so the UI layer never touches Retrofit.
 */
sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Failure(val error: ApiFailure) : ApiResult<Nothing>
}

sealed class ApiFailure(open val message: String) {
    data class Network(override val message: String = "No internet connection.") : ApiFailure(message)
    data class Unauthorized(override val message: String = "Your session has expired. Please sign in again.") : ApiFailure(message)
    data class Forbidden(override val message: String = "You do not have permission to do that.") : ApiFailure(message)
    data class NotFound(override val message: String = "Not found.") : ApiFailure(message)
    data class Conflict(override val message: String = "That action conflicts with the current state.") : ApiFailure(message)
    data class Server(override val message: String = "Server error. Please try again.") : ApiFailure(message)
    data class Validation(override val message: String, val fields: Map<String, String>? = null) : ApiFailure(message)
    data class Unknown(override val message: String = "Something went wrong.") : ApiFailure(message)
}
