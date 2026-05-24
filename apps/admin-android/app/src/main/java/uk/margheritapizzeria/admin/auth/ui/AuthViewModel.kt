package uk.margheritapizzeria.admin.auth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.auth.data.AuthRepository
import uk.margheritapizzeria.admin.core.network.ApiResult

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val errorMessage: String? = null,
    val success: Boolean = false,
)

class AuthViewModel(private val repo: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) {
        _state.update { it.copy(email = value, errorMessage = null) }
    }

    fun onPasswordChange(value: String) {
        _state.update { it.copy(password = value, errorMessage = null) }
    }

    fun submit() {
        val current = _state.value
        if (current.loading) return
        if (current.email.isBlank() || current.password.isBlank()) {
            _state.update { it.copy(errorMessage = "Enter your email and password.") }
            return
        }
        _state.update { it.copy(loading = true, errorMessage = null) }
        viewModelScope.launch {
            // Password is intentionally NOT captured into any log site.
            when (val result = repo.signIn(current.email, current.password)) {
                is ApiResult.Success ->
                    _state.update { it.copy(loading = false, success = true) }
                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, errorMessage = result.error.message) }
            }
        }
    }

    fun consumeSuccess() {
        _state.update { it.copy(success = false) }
    }

    class Factory(private val repo: AuthRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            AuthViewModel(repo) as T
    }
}
