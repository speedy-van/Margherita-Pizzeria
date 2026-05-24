package uk.margheritapizzeria.admin.menu.ui

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
import uk.margheritapizzeria.admin.menu.data.MenuRepository
import uk.margheritapizzeria.admin.menu.model.AdminMenuItem
import uk.margheritapizzeria.admin.menu.model.AdminMenuPayload
import uk.margheritapizzeria.admin.menu.model.MenuItemInput

data class MenuUiState(
    val loading: Boolean = true,
    val data: AdminMenuPayload = AdminMenuPayload(),
    val error: ApiFailure? = null,
    val mutating: Boolean = false,
)

sealed interface MenuMessage {
    data class Info(val text: String) : MenuMessage
    data class Error(val text: String) : MenuMessage
}

class MenuViewModel(private val repo: MenuRepository) : ViewModel() {

    private val _state = MutableStateFlow(MenuUiState())
    val state: StateFlow<MenuUiState> = _state.asStateFlow()

    private val _messages = MutableSharedFlow<MenuMessage>(extraBufferCapacity = 4)
    val messages: SharedFlow<MenuMessage> = _messages.asSharedFlow()

    init { refresh() }

    fun refresh() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.load()) {
                is ApiResult.Success -> _state.update {
                    it.copy(loading = false, data = result.data)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }

    fun toggleAvailable(item: AdminMenuItem) {
        if (_state.value.mutating) return
        _state.update { it.copy(mutating = true) }
        viewModelScope.launch {
            val input = MenuItemInput(
                name = item.name,
                description = item.description,
                pricePence = item.pricePence,
                categoryId = item.categoryId,
                imageUrl = item.imageUrl,
                available = !item.available,
                allergens = item.allergens,
            )
            when (val result = repo.update(item.id, input)) {
                is ApiResult.Success -> {
                    applyUpdated(result.data)
                    _messages.tryEmit(
                        MenuMessage.Info(
                            if (result.data.available) "Marked available" else "Marked unavailable",
                        ),
                    )
                }
                is ApiResult.Failure -> _messages.tryEmit(MenuMessage.Error(result.error.message))
            }
            _state.update { it.copy(mutating = false) }
        }
    }

    fun save(existingId: String?, input: MenuItemInput, onDone: (Boolean) -> Unit) {
        if (_state.value.mutating) return
        _state.update { it.copy(mutating = true) }
        viewModelScope.launch {
            val result = if (existingId != null) repo.update(existingId, input) else repo.create(input)
            when (result) {
                is ApiResult.Success -> {
                    applyUpdated(result.data)
                    _messages.tryEmit(MenuMessage.Info(if (existingId == null) "Item created" else "Item updated"))
                    onDone(true)
                }
                is ApiResult.Failure -> {
                    _messages.tryEmit(MenuMessage.Error(result.error.message))
                    onDone(false)
                }
            }
            _state.update { it.copy(mutating = false) }
        }
    }

    fun delete(item: AdminMenuItem) {
        if (_state.value.mutating) return
        _state.update { it.copy(mutating = true) }
        viewModelScope.launch {
            when (val result = repo.delete(item.id)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        current.copy(
                            data = current.data.copy(items = current.data.items.filterNot { it.id == item.id }),
                        )
                    }
                    _messages.tryEmit(MenuMessage.Info("Item deleted"))
                }
                is ApiResult.Failure -> _messages.tryEmit(MenuMessage.Error(result.error.message))
            }
            _state.update { it.copy(mutating = false) }
        }
    }

    private fun applyUpdated(updated: AdminMenuItem) {
        _state.update { current ->
            val items = current.data.items.toMutableList()
            val idx = items.indexOfFirst { it.id == updated.id }
            if (idx >= 0) items[idx] = updated else items.add(updated)
            current.copy(data = current.data.copy(items = items))
        }
    }

    class Factory(private val repo: MenuRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = MenuViewModel(repo) as T
    }
}
