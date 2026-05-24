package uk.margheritapizzeria.admin.discounts.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.SectionCard
import uk.margheritapizzeria.admin.discounts.model.AdminDiscount
import uk.margheritapizzeria.admin.discounts.model.DiscountInput

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscountsScreen(viewModel: DiscountsViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var showEditor by remember { mutableStateOf<AdminDiscount?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var pendingDelete by remember { mutableStateOf<AdminDiscount?>(null) }

    LaunchedEffect(Unit) {
        viewModel.messages.collect { msg ->
            val text = when (msg) {
                is DiscountsMessage.Info -> msg.text
                is DiscountsMessage.Error -> msg.text
            }
            snackbarHostState.showSnackbar(text)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Icon(Icons.Outlined.Add, contentDescription = "New discount")
            }
        },
    ) { padding ->
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
                if (state.items.isEmpty()) {
                    item {
                        Text(
                            "No discounts yet. Tap + to create one.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                } else {
                    items(state.items, key = { it.id }) { discount ->
                        DiscountRow(
                            discount = discount,
                            onEdit = { showEditor = discount },
                            onDelete = { pendingDelete = discount },
                        )
                    }
                }
            }
        }
    }

    if (showCreate) {
        DiscountEditorDialog(
            initial = null,
            saving = state.mutating,
            onDismiss = { showCreate = false },
            onSubmit = { input ->
                viewModel.create(input)
                showCreate = false
            },
        )
    }
    showEditor?.let { existing ->
        DiscountEditorDialog(
            initial = existing,
            saving = state.mutating,
            onDismiss = { showEditor = null },
            onSubmit = { input ->
                viewModel.update(existing.id, input)
                showEditor = null
            },
        )
    }
    pendingDelete?.let { d ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text("Delete ${d.code}?") },
            text = { Text("Customers will no longer be able to redeem this code.") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.delete(d.id)
                    pendingDelete = null
                }) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { pendingDelete = null }) { Text("Cancel") }
            },
        )
    }
}

@Composable
private fun DiscountRow(
    discount: AdminDiscount,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        onClick = onEdit,
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    discount.code,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    if (discount.active) "Active" else "Inactive",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (discount.active) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.error,
                )
            }
            Spacer(Modifier.height(2.dp))
            Text(discount.title, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(2.dp))
            val valueLabel = if (discount.type == "percentage") "${discount.value}% off"
            else "£${"%.2f".format(discount.value / 100.0)} off"
            Text(
                "$valueLabel · min £${"%.2f".format(discount.minOrderPence / 100.0)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            val targets = buildList {
                if (discount.appliesToDelivery) add("Delivery")
                if (discount.appliesToCollection) add("Collection")
            }.joinToString(" · ").ifEmpty { "(no order types)" }
            Text(
                targets,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(6.dp))
            Row {
                TextButton(onClick = onEdit) { Text("Edit") }
                Spacer(Modifier.width(4.dp))
                TextButton(onClick = onDelete) { Text("Delete") }
            }
        }
    }
}

@Composable
private fun DiscountEditorDialog(
    initial: AdminDiscount?,
    saving: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (DiscountInput) -> Unit,
) {
    var code by remember { mutableStateOf(initial?.code ?: "") }
    var title by remember { mutableStateOf(initial?.title ?: "") }
    var description by remember { mutableStateOf(initial?.description ?: "") }
    var type by remember { mutableStateOf(initial?.type ?: "percentage") }
    var value by remember { mutableStateOf(initial?.value?.toString() ?: "10") }
    var minOrder by remember { mutableStateOf(((initial?.minOrderPence ?: 0) / 100.0).toString()) }
    var active by remember { mutableStateOf(initial?.active ?: true) }
    var appliesDelivery by remember { mutableStateOf(initial?.appliesToDelivery ?: true) }
    var appliesCollection by remember { mutableStateOf(initial?.appliesToCollection ?: true) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "New discount" else "Edit discount") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it.uppercase() },
                    label = { Text("Code (A–Z, 0–9, -, _)") },
                    singleLine = true,
                    enabled = initial == null,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title (banner heading)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row {
                    FilterChip(
                        selected = type == "percentage",
                        onClick = { type = "percentage" },
                        label = { Text("%") },
                    )
                    Spacer(Modifier.width(6.dp))
                    FilterChip(
                        selected = type == "fixed",
                        onClick = { type = "fixed" },
                        label = { Text("£ fixed") },
                    )
                }
                OutlinedTextField(
                    value = value,
                    onValueChange = { value = it.filter { ch -> ch.isDigit() } },
                    label = { Text(if (type == "percentage") "Percent (1–100)" else "Pence off") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = minOrder,
                    onValueChange = { minOrder = it.filter { ch -> ch.isDigit() || ch == '.' } },
                    label = { Text("Min order (£)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Active", modifier = Modifier.weight(1f))
                    Switch(checked = active, onCheckedChange = { active = it })
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Apply to delivery", modifier = Modifier.weight(1f))
                    Switch(checked = appliesDelivery, onCheckedChange = { appliesDelivery = it })
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Apply to collection", modifier = Modifier.weight(1f))
                    Switch(checked = appliesCollection, onCheckedChange = { appliesCollection = it })
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !saving && code.isNotBlank() && title.isNotBlank() && value.isNotBlank(),
                onClick = {
                    val pounds = minOrder.toDoubleOrNull() ?: 0.0
                    onSubmit(
                        DiscountInput(
                            code = code.trim(),
                            title = title.trim(),
                            description = description.trim().ifBlank { null },
                            type = type,
                            value = value.toIntOrNull() ?: 0,
                            minOrderPence = (pounds * 100).toInt().coerceAtLeast(0),
                            startsAt = null,
                            endsAt = null,
                            active = active,
                            appliesToDelivery = appliesDelivery,
                            appliesToCollection = appliesCollection,
                        ),
                    )
                },
            ) { Text(if (saving) "Saving…" else "Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
