package uk.margheritapizzeria.admin.settings.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.core.network.ApiFailure
import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.settings.data.SettingsRepository
import uk.margheritapizzeria.admin.settings.model.AdminSettings
import uk.margheritapizzeria.admin.settings.model.AdminSettingsInput
import uk.margheritapizzeria.admin.settings.model.AdminTable
import uk.margheritapizzeria.admin.settings.model.AdminTableUpdate
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlot
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlotInput

data class SettingsUiState(
    val loading: Boolean = true,
    val settings: AdminSettings = AdminSettings(),
    val timeSlots: List<AdminTimeSlot> = emptyList(),
    val tables: List<AdminTable> = emptyList(),
    val error: ApiFailure? = null,
    val saving: Boolean = false,
)

sealed interface SettingsMessage {
    data class Info(val text: String) : SettingsMessage
    data class Error(val text: String) : SettingsMessage
}

class SettingsViewModel(private val repo: SettingsRepository) : ViewModel() {
    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    private val _messages = MutableSharedFlow<SettingsMessage>(extraBufferCapacity = 4)
    val messages: SharedFlow<SettingsMessage> = _messages.asSharedFlow()

    init { refresh() }

    fun refresh() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val settings = repo.getSettings()
            val slots = repo.listTimeSlots()
            val tables = repo.listTables()
            val results: List<ApiResult<*>> = listOf(settings, slots, tables)
            val failure: ApiResult.Failure? = results
                .filterIsInstance<ApiResult.Failure>()
                .firstOrNull()
            if (failure != null) {
                _state.update { it.copy(loading = false, error = failure.error) }
                return@launch
            }
            _state.update {
                it.copy(
                    loading = false,
                    settings = (settings as ApiResult.Success).data,
                    timeSlots = (slots as ApiResult.Success).data,
                    tables = (tables as ApiResult.Success).data,
                )
            }
        }
    }

    fun saveSettings(input: AdminSettingsInput) {
        if (_state.value.saving) return
        _state.update { it.copy(saving = true) }
        viewModelScope.launch {
            when (val result = repo.updateSettings(input)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(saving = false, settings = result.data) }
                    _messages.tryEmit(SettingsMessage.Info("Settings updated"))
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(saving = false) }
                    _messages.tryEmit(SettingsMessage.Error(result.error.message))
                }
            }
        }
    }

    fun toggleSlot(slot: AdminTimeSlot) {
        viewModelScope.launch {
            when (val result = repo.updateTimeSlot(slot.copy(active = !slot.active))) {
                is ApiResult.Success -> replaceSlot(result.data)
                is ApiResult.Failure -> _messages.tryEmit(SettingsMessage.Error(result.error.message))
            }
        }
    }

    fun addSlot(input: AdminTimeSlotInput) {
        viewModelScope.launch {
            when (val result = repo.createTimeSlot(input)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(timeSlots = it.timeSlots + result.data) }
                    _messages.tryEmit(SettingsMessage.Info("Time slot added"))
                }
                is ApiResult.Failure -> _messages.tryEmit(SettingsMessage.Error(result.error.message))
            }
        }
    }

    fun updateTable(update: AdminTableUpdate) {
        viewModelScope.launch {
            when (val result = repo.updateTable(update)) {
                is ApiResult.Success -> replaceTable(result.data)
                is ApiResult.Failure -> _messages.tryEmit(SettingsMessage.Error(result.error.message))
            }
        }
    }

    private fun replaceSlot(updated: AdminTimeSlot) {
        _state.update { current ->
            current.copy(timeSlots = current.timeSlots.map { if (it.id == updated.id) updated else it })
        }
    }

    private fun replaceTable(updated: AdminTable) {
        _state.update { current ->
            current.copy(tables = current.tables.map { if (it.id == updated.id) updated else it })
        }
    }

    class Factory(private val repo: SettingsRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = SettingsViewModel(repo) as T
    }
}
