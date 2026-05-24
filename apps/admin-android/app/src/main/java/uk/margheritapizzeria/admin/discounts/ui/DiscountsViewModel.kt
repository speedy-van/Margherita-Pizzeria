package uk.margheritapizzeria.admin.discounts.ui

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
import uk.margheritapizzeria.admin.discounts.data.DiscountsRepository
import uk.margheritapizzeria.admin.discounts.model.AdminDiscount
import uk.margheritapizzeria.admin.discounts.model.DiscountInput

data class DiscountsUiState(
    val loading: Boolean = true,
    val items: List<AdminDiscount> = emptyList(),
    val error: ApiFailure? = null,
    val mutating: Boolean = false,
)

sealed interface DiscountsMessage {
    data class Info(val text: String) : DiscountsMessage
    data class Error(val text: String) : DiscountsMessage
}

class DiscountsViewModel(private val repo: DiscountsRepository) : ViewModel() {
    private val _state = MutableStateFlow(DiscountsUiState())
    val state: StateFlow<DiscountsUiState> = _state.asStateFlow()

    private val _messages = MutableSharedFlow<DiscountsMessage>(extraBufferCapacity = 4)
    val messages: SharedFlow<DiscountsMessage> = _messages.asSharedFlow()

    init { refresh() }

    fun refresh() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.list()) {
                is ApiResult.Success ->
                    _state.update { it.copy(loading = false, items = result.data.sortedBy { d -> d.code }) }
                is ApiResult.Failure ->
                    _state.update { it.copy(loading = false, error = result.error) }
            }
        }
    }

    fun create(input: DiscountInput) {
        if (_state.value.mutating) return
        _state.update { it.copy(mutating = true) }
        viewModelScope.launch {
            when (val r = repo.create(input)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            mutating = false,
                            items = (it.items + r.data).sortedBy { d -> d.code },
                        )
                    }
                    _messages.tryEmit(DiscountsMessage.Info("Discount created"))
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(mutating = false) }
                    _messages.tryEmit(DiscountsMessage.Error(r.error.message))
                }
            }
        }
    }

    fun update(id: String, input: DiscountInput) {
        if (_state.value.mutating) return
        _state.update { it.copy(mutating = true) }
        viewModelScope.launch {
            when (val r = repo.update(id, input)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        current.copy(
                            mutating = false,
                            items = current.items
                                .map { if (it.id == r.data.id) r.data else it }
                                .sortedBy { d -> d.code },
                        )
                    }
                    _messages.tryEmit(DiscountsMessage.Info("Discount updated"))
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(mutating = false) }
                    _messages.tryEmit(DiscountsMessage.Error(r.error.message))
                }
            }
        }
    }

    fun delete(id: String) {
        if (_state.value.mutating) return
        _state.update { it.copy(mutating = true) }
        viewModelScope.launch {
            when (val r = repo.delete(id)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(mutating = false, items = it.items.filter { d -> d.id != id }) }
                    _messages.tryEmit(DiscountsMessage.Info("Discount deleted"))
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(mutating = false) }
                    _messages.tryEmit(DiscountsMessage.Error(r.error.message))
                }
            }
        }
    }

    class Factory(private val repo: DiscountsRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = DiscountsViewModel(repo) as T
    }
}
