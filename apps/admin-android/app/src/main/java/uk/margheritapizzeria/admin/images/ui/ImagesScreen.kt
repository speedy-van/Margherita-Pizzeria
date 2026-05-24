package uk.margheritapizzeria.admin.images.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.SectionCard
import uk.margheritapizzeria.admin.images.model.AdminImage

@Composable
fun ImagesScreen(viewModel: ImagesViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(Unit) {
        viewModel.messages.collect { msg ->
            val text = when (msg) {
                is ImagesMessage.Info -> msg.text
                is ImagesMessage.Error -> msg.text
            }
            snackbarHostState.showSnackbar(text)
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        when {
            state.loading && state.items.isEmpty() -> LoadingState(Modifier.padding(padding))
            state.error != null && state.items.isEmpty() -> ErrorState(
                message = state.error?.message ?: "",
                onRetry = viewModel::refresh,
                modifier = Modifier.padding(padding),
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items, key = { it.id }) { image ->
                    ImageRow(image = image, saving = state.saving) { url ->
                        viewModel.updateUrl(image, url)
                    }
                }
            }
        }
    }
}

@Composable
private fun ImageRow(image: AdminImage, saving: Boolean, onSave: (String) -> Unit) {
    var url by remember(image.id, image.url) { mutableStateOf(image.url) }
    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(image.label.ifBlank { image.id }, style = MaterialTheme.typography.titleMedium)
            if (image.section.isNotBlank()) {
                Text(
                    "Section: ${image.section}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text("Image URL") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(2.dp))
            Button(
                enabled = !saving && url.isNotBlank() && url != image.url,
                onClick = { onSave(url.trim()) },
            ) { Text("Save") }
        }
    }
}
