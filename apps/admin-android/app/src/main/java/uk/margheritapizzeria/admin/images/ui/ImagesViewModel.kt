package uk.margheritapizzeria.admin.images.ui

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
import uk.margheritapizzeria.admin.images.data.ImagesRepository
import uk.margheritapizzeria.admin.images.model.AdminImage

data class ImagesUiState(
    val loading: Boolean = true,
    val items: List<AdminImage> = emptyList(),
    val error: ApiFailure? = null,
    val saving: Boolean = false,
)

sealed interface ImagesMessage {
    data class Info(val text: String) : ImagesMessage
    data class Error(val text: String) : ImagesMessage
}

class ImagesViewModel(private val repo: ImagesRepository) : ViewModel() {
    private val _state = MutableStateFlow(ImagesUiState())
    val state: StateFlow<ImagesUiState> = _state.asStateFlow()

    private val _messages = MutableSharedFlow<ImagesMessage>(extraBufferCapacity = 4)
    val messages: SharedFlow<ImagesMessage> = _messages.asSharedFlow()

    init { refresh() }

    fun refresh() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val result = repo.list()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = result.data) }
                is ApiResult.Failure -> _state.update { it.copy(loading = false, error = result.error) }
            }
        }
    }

    fun updateUrl(image: AdminImage, url: String) {
        if (_state.value.saving) return
        _state.update { it.copy(saving = true) }
        viewModelScope.launch {
            when (val result = repo.update(image.id, url)) {
                is ApiResult.Success -> {
                    _state.update { current ->
                        current.copy(
                            saving = false,
                            items = current.items.map { if (it.id == result.data.id) result.data else it },
                        )
                    }
                    _messages.tryEmit(ImagesMessage.Info("Image updated"))
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(saving = false) }
                    _messages.tryEmit(ImagesMessage.Error(result.error.message))
                }
            }
        }
    }

    class Factory(private val repo: ImagesRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = ImagesViewModel(repo) as T
    }
}
