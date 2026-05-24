package uk.margheritapizzeria.admin.orders.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.core.network.ApiFailure
import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.orders.data.OrdersRepository
import uk.margheritapizzeria.admin.orders.model.AdminOrderDetail
import uk.margheritapizzeria.admin.orders.model.AdminOrderListItem

data class OrdersListState(
    val loading: Boolean = true,
    val all: List<AdminOrderListItem> = emptyList(),
    val statusFilter: String? = null,
    val typeFilter: String? = null,
    val search: String = "",
    val error: ApiFailure? = null,
) {
    val visible: List<AdminOrderListItem>
        get() = all.asSequence()
            .filter { statusFilter == null || it.status == statusFilter }
            .filter { typeFilter == null || it.type == typeFilter }
            .filter {
                if (search.isBlank()) true
                else {
                    val q = search.trim().lowercase()
                    it.id.lowercase().contains(q) || it.customerName.lowercase().contains(q)
                }
            }
            .toList()
}

class OrdersViewModel(private val repo: OrdersRepository) : ViewModel() {

    private val _state = MutableStateFlow(OrdersListState())
    val state: StateFlow<OrdersListState> = _state.asStateFlow()

    init { refresh() }

    fun refresh() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.list()) {
                is ApiResult.Success -> _state.update {
                    it.copy(loading = false, all = result.data)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }

    fun setStatusFilter(value: String?) = _state.update { it.copy(statusFilter = value) }
    fun setTypeFilter(value: String?) = _state.update { it.copy(typeFilter = value) }
    fun setSearch(value: String) = _state.update { it.copy(search = value) }

    class Factory(private val repo: OrdersRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = OrdersViewModel(repo) as T
    }
}

data class OrderDetailState(
    val loading: Boolean = true,
    val data: AdminOrderDetail? = null,
    val error: ApiFailure? = null,
    val updating: Boolean = false,
    val updateError: String? = null,
)

class OrderDetailViewModel(
    private val repo: OrdersRepository,
    private val orderId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(OrderDetailState())
    val state: StateFlow<OrderDetailState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.detail(orderId)) {
                is ApiResult.Success -> _state.update {
                    it.copy(loading = false, data = result.data)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(loading = false, error = result.error)
                }
            }
        }
    }

    fun updateStatus(status: String) {
        if (_state.value.updating) return
        _state.update { it.copy(updating = true, updateError = null) }
        viewModelScope.launch {
            when (val result = repo.updateStatus(orderId, status)) {
                is ApiResult.Success -> _state.update {
                    it.copy(updating = false, data = result.data)
                }
                is ApiResult.Failure -> _state.update {
                    it.copy(updating = false, updateError = result.error.message)
                }
            }
        }
    }

    class Factory(
        private val repo: OrdersRepository,
        private val orderId: String,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            OrderDetailViewModel(repo, orderId) as T
    }
}
