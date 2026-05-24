package uk.margheritapizzeria.admin.core.session

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.core.datastore.SessionStore

sealed interface AuthState {
    data object Unknown : AuthState
    data object SignedOut : AuthState
    data class SignedIn(val userId: String, val email: String, val role: String) : AuthState
}

sealed interface SessionEvent {
    data object SignedOutRemotely : SessionEvent
}

/**
 * Process-wide authentication state. The OkHttp `AuthInterceptor` reads
 * `currentToken` synchronously; UI observes `state` reactively.
 */
class SessionManager(
    private val store: SessionStore,
    private val scope: CoroutineScope,
) {
    @Volatile
    var currentToken: String? = null
        private set

    private val _state = MutableStateFlow<AuthState>(AuthState.Unknown)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<SessionEvent>(extraBufferCapacity = 4)
    val events: SharedFlow<SessionEvent> = _events.asSharedFlow()

    init {
        scope.launch {
            store.snapshotFlow.collect { snap ->
                currentToken = snap.token
                _state.value = if (snap.isAuthenticated && snap.userId != null &&
                    snap.email != null && snap.role != null
                ) {
                    AuthState.SignedIn(snap.userId, snap.email, snap.role)
                } else {
                    AuthState.SignedOut
                }
            }
        }
    }

    suspend fun signIn(token: String, userId: String, email: String, role: String) {
        // Update the volatile token and in-memory state synchronously so the
        // OkHttp `AuthInterceptor` and UI see the new session immediately,
        // without waiting for the DataStore `snapshotFlow` to re-emit. Without
        // this, the first authenticated request fires before `currentToken`
        // is populated, the server returns 401, and `UnauthorizedInterceptor`
        // wipes the session — surfacing as "signed out, please log in again"
        // right after a successful login.
        currentToken = token
        _state.value = AuthState.SignedIn(userId, email, role)
        store.save(token = token, userId = userId, email = email, role = role)
    }

    suspend fun signOutLocal() {
        currentToken = null
        _state.value = AuthState.SignedOut
        store.clear()
    }

    /**
     * Invoked by the network layer when the server returns 401. Clears the
     * stored token and emits a one-shot event so the UI can navigate to
     * the login screen.
     */
    fun onUnauthorized() {
        currentToken = null
        _state.value = AuthState.SignedOut
        scope.launch {
            store.clear()
            _events.tryEmit(SessionEvent.SignedOutRemotely)
        }
    }
}
