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

data class ForgotPasswordUiState(
    val email: String = "",
    val loading: Boolean = false,
    val sent: Boolean = false,
    val errorMessage: String? = null,
)

class ForgotPasswordViewModel(private val repo: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(ForgotPasswordUiState())
    val state: StateFlow<ForgotPasswordUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) {
        _state.update { it.copy(email = value, errorMessage = null) }
    }

    fun submit() {
        val current = _state.value
        if (current.loading || current.sent || current.email.isBlank()) return
        _state.update { it.copy(loading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val r = repo.requestPasswordReset(current.email)) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, sent = true) }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, errorMessage = r.error.message)
                }
            }
        }
    }

    class Factory(private val repo: AuthRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            ForgotPasswordViewModel(repo) as T
    }
}
