package uk.margheritapizzeria.admin.bookings.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.bookings.data.BookingsRepository
import uk.margheritapizzeria.admin.bookings.model.AdminBookingDetail
import uk.margheritapizzeria.admin.bookings.model.AdminBookingListItem
import uk.margheritapizzeria.admin.core.network.ApiFailure
import uk.margheritapizzeria.admin.core.network.ApiResult

data class BookingsListState(
    val loading: Boolean = true,
    val all: List<AdminBookingListItem> = emptyList(),
    val statusFilter: String? = null,
    val dateFilter: String? = null,
    val error: ApiFailure? = null,
) {
    val visible: List<AdminBookingListItem>
        get() = all.asSequence()
            .filter { statusFilter == null || it.status == statusFilter }
            .filter { dateFilter == null || it.date == dateFilter }
            .toList()
}

class BookingsViewModel(private val repo: BookingsRepository) : ViewModel() {
    private val _state = MutableStateFlow(BookingsListState())
    val state: StateFlow<BookingsListState> = _state.asStateFlow()
    init { refresh() }

    fun refresh() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.list()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, all = result.data) }
                is ApiResult.Failure -> _state.update { it.copy(loading = false, error = result.error) }
            }
        }
    }

    fun setStatusFilter(value: String?) = _state.update { it.copy(statusFilter = value) }
    fun setDateFilter(value: String?) = _state.update { it.copy(dateFilter = value) }

    class Factory(private val repo: BookingsRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = BookingsViewModel(repo) as T
    }
}

data class BookingDetailState(
    val loading: Boolean = true,
    val data: AdminBookingDetail? = null,
    val error: ApiFailure? = null,
    val updating: Boolean = false,
    val updateError: String? = null,
)

class BookingDetailViewModel(
    private val repo: BookingsRepository,
    private val bookingId: String,
) : ViewModel() {
    private val _state = MutableStateFlow(BookingDetailState())
    val state: StateFlow<BookingDetailState> = _state.asStateFlow()
    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.detail(bookingId)) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, data = result.data) }
                is ApiResult.Failure -> _state.update { it.copy(loading = false, error = result.error) }
            }
        }
    }

    fun updateStatus(status: String) {
        if (_state.value.updating) return
        _state.update { it.copy(updating = true, updateError = null) }
        viewModelScope.launch {
            when (val result = repo.updateStatus(bookingId, status)) {
                is ApiResult.Success -> _state.update { it.copy(updating = false, data = result.data) }
                is ApiResult.Failure -> _state.update { it.copy(updating = false, updateError = result.error.message) }
            }
        }
    }

    class Factory(
        private val repo: BookingsRepository,
        private val bookingId: String,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            BookingDetailViewModel(repo, bookingId) as T
    }
}
