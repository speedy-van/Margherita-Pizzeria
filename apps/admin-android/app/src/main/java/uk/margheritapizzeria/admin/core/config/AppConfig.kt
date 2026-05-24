package uk.margheritapizzeria.admin.core.config

import uk.margheritapizzeria.admin.BuildConfig

/**
 * Compile-time configuration sourced from Gradle BuildConfig fields.
 *
 * The base URL is wired in `app/build.gradle.kts` from `gradle.properties`
 * (or per-developer `local.properties`):
 *   debug   → margherita.baseUrl.debug   (defaults to http://10.0.2.2:3000/)
 *   release → margherita.baseUrl.release (defaults to https://www.margheritapizza.uk/)
 */
object AppConfig {
    val baseUrl: String = BuildConfig.BASE_URL
    val httpLoggingEnabled: Boolean = BuildConfig.ENABLE_HTTP_LOGGING
}
