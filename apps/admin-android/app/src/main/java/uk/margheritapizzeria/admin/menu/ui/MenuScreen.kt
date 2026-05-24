package uk.margheritapizzeria.admin.menu.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import uk.margheritapizzeria.admin.core.ui.format.formatPence
import uk.margheritapizzeria.admin.menu.model.AdminMenuItem

@Composable
fun MenuScreen(viewModel: MenuViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var editing by remember { mutableStateOf<AdminMenuItem?>(null) }
    var creating by remember { mutableStateOf(false) }
    var deleteCandidate by remember { mutableStateOf<AdminMenuItem?>(null) }

    LaunchedEffect(Unit) {
        viewModel.messages.collect { msg ->
            val text = when (msg) {
                is MenuMessage.Info -> msg.text
                is MenuMessage.Error -> msg.text
            }
            snackbarHostState.showSnackbar(text)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { creating = true },
                icon = { Icon(Icons.Outlined.Add, contentDescription = null) },
                text = { Text("Add item") },
            )
        },
    ) { padding ->
        when {
            state.loading && state.data.items.isEmpty() ->
                LoadingState(Modifier.padding(padding))
            state.error != null && state.data.items.isEmpty() ->
                ErrorState(
                    message = state.error?.message ?: "",
                    onRetry = viewModel::refresh,
                    modifier = Modifier.padding(padding),
                )
            else -> MenuList(
                viewModel = viewModel,
                onEdit = { editing = it },
                onDelete = { deleteCandidate = it },
                modifier = Modifier.padding(padding),
            )
        }
    }

    if (creating) {
        MenuItemEditorDialog(
            initial = null,
            categories = state.data.categories,
            onDismiss = { creating = false },
            onSave = { input ->
                viewModel.save(existingId = null, input = input) { ok ->
                    if (ok) creating = false
                }
            },
        )
    }
    editing?.let { item ->
        MenuItemEditorDialog(
            initial = item,
            categories = state.data.categories,
            onDismiss = { editing = null },
            onSave = { input ->
                viewModel.save(existingId = item.id, input = input) { ok ->
                    if (ok) editing = null
                }
            },
        )
    }
    deleteCandidate?.let { item ->
        AlertDialog(
            onDismissRequest = { deleteCandidate = null },
            title = { Text("Delete item") },
            text = { Text("Delete \"${item.name}\"? This cannot be undone.") },
            confirmButton = {
                Button(onClick = {
                    viewModel.delete(item); deleteCandidate = null
                }) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { deleteCandidate = null }) { Text("Cancel") }
            },
        )
    }
}

@Composable
private fun MenuList(
    viewModel: MenuViewModel,
    onEdit: (AdminMenuItem) -> Unit,
    onDelete: (AdminMenuItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val byCategory = state.data.items.groupBy { it.categoryId }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        state.data.categories.sortedBy { it.displayOrder }.forEach { cat ->
            item(key = "cat-${cat.id}") {
                Text(
                    cat.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
            val itemsForCat = byCategory[cat.id].orEmpty()
            if (itemsForCat.isEmpty()) {
                item(key = "cat-${cat.id}-empty") {
                    Text(
                        "No items in this category.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                items(itemsForCat, key = { it.id }) { item ->
                    MenuItemRow(
                        item = item,
                        onToggle = { viewModel.toggleAvailable(item) },
                        onEdit = { onEdit(item) },
                        onDelete = { onDelete(item) },
                    )
                }
            }
        }
        val uncategorised = byCategory[null].orEmpty()
        if (uncategorised.isNotEmpty()) {
            item(key = "cat-none") {
                Text("Uncategorised", style = MaterialTheme.typography.titleMedium)
            }
            items(uncategorised, key = { it.id }) { item ->
                MenuItemRow(
                    item = item,
                    onToggle = { viewModel.toggleAvailable(item) },
                    onEdit = { onEdit(item) },
                    onDelete = { onDelete(item) },
                )
            }
        }
    }
}

@Composable
private fun MenuItemRow(
    item: AdminMenuItem,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        onClick = onEdit,
    ) {
        Column(Modifier.padding(14.dp)) {
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            ) {
                Text(
                    item.name,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f),
                )
                Text(formatPence(item.pricePence), style = MaterialTheme.typography.titleMedium)
            }
            if (!item.description.isNullOrBlank()) {
                Text(
                    item.description,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            if (item.allergens.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    "Allergens: " + item.allergens.joinToString(", "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(8.dp))
            androidx.compose.foundation.layout.Row(
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Available")
                Spacer(Modifier.width(8.dp))
                Switch(checked = item.available, onCheckedChange = { onToggle() })
                Spacer(Modifier.weight(1f))
                TextButton(onClick = onDelete) { Text("Delete", color = MaterialTheme.colorScheme.error) }
            }
        }
    }
}

