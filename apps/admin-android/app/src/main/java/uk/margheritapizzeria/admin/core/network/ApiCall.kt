package uk.margheritapizzeria.admin.core.network

import android.util.Log
import kotlinx.serialization.SerializationException
import retrofit2.HttpException
import retrofit2.Response
import uk.margheritapizzeria.admin.BuildConfig
import java.io.IOException

private const val TAG = "MargheritaApi"

/**
 * Maps a Retrofit `Response<ApiEnvelope<T>>` (or an exception from invoking
 * one) into an `ApiResult<T>`. Centralising this keeps every repository
 * tiny and consistent.
 *
 * In debug builds, structured diagnostics are emitted via logcat under the
 * `MargheritaApi` tag (HTTP method/URL, status code, error envelope code,
 * exception class + message). NEVER logs request/response bodies, the
 * Authorization header, cookies, or any token material.
 *
 * Usage:
 *   apiCall { service.getOrders() }
 */
suspend inline fun <T> apiCall(
    crossinline block: suspend () -> Response<ApiEnvelope<T>>,
): ApiResult<T> = try {
    val response = block()
    val envelope = response.body()
    when {
        response.isSuccessful && envelope?.ok == true && envelope.data != null ->
            ApiResult.Success(envelope.data)

        response.isSuccessful && envelope?.ok == true -> {
            logApi("EMPTY_DATA", response, envelope, null)
            ApiResult.Failure(ApiFailure.Unknown("Empty response body."))
        }

        else -> {
            logApi("HTTP_${response.code()}", response, envelope, null)
            ApiResult.Failure(mapHttp(response.code(), envelope?.error))
        }
    }
} catch (e: IOException) {
    logApi("IO_ERROR", null, null, e)
    ApiResult.Failure(ApiFailure.Network())
} catch (e: HttpException) {
    logApi("HTTP_EXCEPTION_${e.code()}", null, null, e)
    ApiResult.Failure(mapHttp(e.code(), null))
} catch (e: SerializationException) {
    logApi("PARSE_ERROR", null, null, e)
    ApiResult.Failure(ApiFailure.Unknown("Unexpected response from server."))
} catch (e: Throwable) {
    logApi("UNKNOWN_ERROR", null, null, e)
    ApiResult.Failure(ApiFailure.Unknown())
}

@PublishedApi
internal fun <T> logApi(
    kind: String,
    response: Response<ApiEnvelope<T>>?,
    envelope: ApiEnvelope<T>?,
    err: Throwable?,
) {
    if (!BuildConfig.ENABLE_HTTP_LOGGING) return
    val req = response?.raw()?.request
    val method = req?.method ?: "?"
    // url.encodedPath excludes any query string; safe to log.
    val path = req?.url?.encodedPath ?: "?"
    val code = response?.code() ?: -1
    val errCode = envelope?.error?.code ?: "-"
    val exClass = err?.javaClass?.simpleName ?: "-"
    val exMsg = err?.message?.take(200) ?: "-"
    Log.d(
        TAG,
        "kind=$kind method=$method path=$path http=$code envErr=$errCode " +
            "ex=$exClass msg=$exMsg",
    )
}

@PublishedApi
internal fun mapHttp(code: Int, error: ApiError?): ApiFailure = when (code) {
    401 -> ApiFailure.Unauthorized(error?.message ?: ApiFailure.Unauthorized().message)
    403 -> ApiFailure.Forbidden(error?.message ?: ApiFailure.Forbidden().message)
    404 -> ApiFailure.NotFound(error?.message ?: ApiFailure.NotFound().message)
    409 -> ApiFailure.Conflict(error?.message ?: ApiFailure.Conflict().message)
    422, 400 -> ApiFailure.Validation(
        message = error?.message ?: "Please check the fields and try again.",
        fields = error?.fields,
    )
    in 500..599 -> ApiFailure.Server(error?.message ?: ApiFailure.Server().message)
    else -> ApiFailure.Unknown(error?.message ?: ApiFailure.Unknown().message)
}
