package uk.margheritapizzeria.admin.core.datastore

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.adminSessionDataStore by preferencesDataStore(name = "admin_session")

/**
 * Persistent storage for the mobile admin Bearer token and the cached
 * user identity. The token is the only sensitive value — it is stored in
 * DataStore Preferences; for higher-assurance deployments swap this with
 * `EncryptedSharedPreferences` or Jetpack Security Crypto.
 *
 * No part of the token is ever logged.
 */
class SessionStore(private val context: Context) {

    private object Keys {
        val TOKEN: Preferences.Key<String> = stringPreferencesKey("token")
        val USER_ID: Preferences.Key<String> = stringPreferencesKey("user_id")
        val USER_EMAIL: Preferences.Key<String> = stringPreferencesKey("user_email")
        val USER_ROLE: Preferences.Key<String> = stringPreferencesKey("user_role")
    }

    data class Snapshot(
        val token: String?,
        val userId: String?,
        val email: String?,
        val role: String?,
    ) {
        val isAuthenticated: Boolean get() = !token.isNullOrBlank()
    }

    val snapshotFlow: Flow<Snapshot> = context.adminSessionDataStore.data.map { prefs ->
        Snapshot(
            token = prefs[Keys.TOKEN],
            userId = prefs[Keys.USER_ID],
            email = prefs[Keys.USER_EMAIL],
            role = prefs[Keys.USER_ROLE],
        )
    }

    suspend fun save(token: String, userId: String, email: String, role: String) {
        context.adminSessionDataStore.edit { prefs ->
            prefs[Keys.TOKEN] = token
            prefs[Keys.USER_ID] = userId
            prefs[Keys.USER_EMAIL] = email
            prefs[Keys.USER_ROLE] = role
        }
    }

    suspend fun clear() {
        context.adminSessionDataStore.edit { it.clear() }
    }
}
