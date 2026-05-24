package uk.margheritapizzeria.admin.dashboard.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.core.network.ApiFailure
import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.dashboard.data.AdminDashboardStats
import uk.margheritapizzeria.admin.dashboard.data.DashboardRepository

sealed interface DashboardUiState {
    data object Loading : DashboardUiState
    data class Error(val failure: ApiFailure) : DashboardUiState
    data class Ready(val data: AdminDashboardStats, val refreshing: Boolean = false) : DashboardUiState
}

class DashboardViewModel(private val repo: DashboardRepository) : ViewModel() {

    private val _state = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    init { refresh() }

    fun refresh() {
        val current = _state.value
        if (current is DashboardUiState.Ready) {
            _state.value = current.copy(refreshing = true)
        } else {
            _state.value = DashboardUiState.Loading
        }
        viewModelScope.launch {
            when (val result = repo.load()) {
                is ApiResult.Success -> _state.value = DashboardUiState.Ready(result.data, refreshing = false)
                is ApiResult.Failure -> _state.value = DashboardUiState.Error(result.error)
            }
        }
    }

    class Factory(private val repo: DashboardRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            DashboardViewModel(repo) as T
    }
}
