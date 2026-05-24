package uk.margheritapizzeria.admin.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import uk.margheritapizzeria.admin.core.config.AppConfig
import uk.margheritapizzeria.admin.core.session.SessionManager
import java.util.concurrent.TimeUnit

object ApiClient {

    val json: Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        explicitNulls = false
    }

    fun build(session: SessionManager): Retrofit {
        val builder = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor(AuthInterceptor(session))
            .addInterceptor(UnauthorizedInterceptor(session))

        if (AppConfig.httpLoggingEnabled) {
            val logging = HttpLoggingInterceptor()
            logging.level = HttpLoggingInterceptor.Level.BASIC
            // Redact anything sensitive so we never log tokens or cookies.
            logging.redactHeader("Authorization")
            logging.redactHeader("Cookie")
            logging.redactHeader("Set-Cookie")
            builder.addInterceptor(logging)
        }

        val client = builder.build()
        val contentType = "application/json".toMediaType()

        return Retrofit.Builder()
            .baseUrl(AppConfig.baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }
}
