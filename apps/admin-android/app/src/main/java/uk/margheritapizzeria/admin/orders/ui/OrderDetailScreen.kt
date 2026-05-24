package uk.margheritapizzeria.admin.orders.ui

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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import uk.margheritapizzeria.admin.core.ui.components.StatusBadge
import uk.margheritapizzeria.admin.core.ui.components.orderStatusKind
import uk.margheritapizzeria.admin.core.ui.format.formatPence
import uk.margheritapizzeria.admin.core.ui.format.formatShortDateTime
import uk.margheritapizzeria.admin.orders.model.AdminOrderDetail
import uk.margheritapizzeria.admin.orders.model.OrderStatuses

@Composable
fun OrderDetailScreen(viewModel: OrderDetailViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    when {
        state.loading -> LoadingState()
        state.error != null && state.data == null -> ErrorState(
            message = state.error?.message ?: "",
            onRetry = viewModel::load,
        )
        state.data != null -> DetailContent(
            data = state.data!!,
            updating = state.updating,
            updateError = state.updateError,
            onUpdate = viewModel::updateStatus,
        )
    }
}

@Composable
private fun DetailContent(
    data: AdminOrderDetail,
    updating: Boolean,
    updateError: String?,
    onUpdate: (String) -> Unit,
) {
    var pendingTerminal by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            SectionCard {
                Column {
                    androidx.compose.foundation.layout.Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    ) {
                        Text(
                            "Order #${data.reference ?: data.id.take(8).uppercase()}",
                            style = MaterialTheme.typography.titleLarge,
                            modifier = Modifier.weight(1f),
                        )
                        StatusBadge(data.status, orderStatusKind(data.status))
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${data.type.replaceFirstChar { it.uppercase() }} · ${data.paymentMethod}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Text(
                        "Placed ${formatShortDateTime(data.createdAt)}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    if (!data.estimatedTime.isNullOrBlank()) {
                        Text(
                            "Estimated ${data.estimatedTime}",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }

        item {
            SectionCard {
                Column {
                    Text("Customer", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(data.customerName)
                    Text(data.customerEmail)
                    Text(data.customerPhone)
                    if (!data.address.isNullOrBlank()) {
                        Spacer(Modifier.height(6.dp))
                        Text("Delivery to:")
                        Text(data.address)
                    }
                }
            }
        }

        item {
            SectionCard {
                Column {
                    Text("Items", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(6.dp))
                    data.items.forEach { item ->
                        androidx.compose.foundation.layout.Row(Modifier.fillMaxWidth()) {
                            Text("${item.quantity}× ", style = MaterialTheme.typography.bodyLarge)
                            Text(
                                item.name,
                                style = MaterialTheme.typography.bodyLarge,
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                formatPence(item.pricePence * item.quantity),
                                style = MaterialTheme.typography.bodyLarge,
                            )
                        }
                        if (!item.notes.isNullOrBlank()) {
                            Text(
                                item.notes,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(8.dp))
                    SubtotalRow("Subtotal", data.subtotalPence)
                    if (data.deliveryFeePence > 0) {
                        SubtotalRow("Delivery", data.deliveryFeePence)
                    }
                    if (data.discountPence > 0) {
                        SubtotalRow(
                            "Discount" + (data.discountCode?.let { " ($it)" } ?: ""),
                            -data.discountPence,
                        )
                    }
                    SubtotalRow("Total", data.totalPence, bold = true)
                }
            }
        }

        item {
            SectionCard {
                Column {
                    Text("Update status", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    androidx.compose.foundation.lazy.LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(OrderStatuses.all) { status ->
                            val isCurrent = data.status == status
                            val isTerminal = status in OrderStatuses.terminal
                            AssistChip(
                                enabled = !updating && !isCurrent,
                                onClick = {
                                    if (isTerminal) pendingTerminal = status
                                    else onUpdate(status)
                                },
                                label = {
                                    Text(status.replace('_', ' ').replaceFirstChar { it.uppercase() })
                                },
                            )
                        }
                    }
                    if (updateError != null) {
                        Spacer(Modifier.height(8.dp))
                        Text(updateError, color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }

    val terminal = pendingTerminal
    if (terminal != null) {
        AlertDialog(
            onDismissRequest = { pendingTerminal = null },
            title = { Text("Confirm status change") },
            text = {
                Text(
                    "Are you sure you want to mark this order as " +
                        terminal.replace('_', ' ') + "? This cannot be undone.",
                )
            },
            confirmButton = {
                Button(onClick = {
                    onUpdate(terminal); pendingTerminal = null
                }) { Text("Confirm") }
            },
            dismissButton = {
                TextButton(onClick = { pendingTerminal = null }) { Text("Cancel") }
            },
        )
    }
}

@Composable
private fun SubtotalRow(label: String, pence: Int, bold: Boolean = false) {
    val style = if (bold) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyLarge
    androidx.compose.foundation.layout.Row(Modifier.fillMaxWidth()) {
        Text(label, style = style, modifier = Modifier.weight(1f))
        Text(formatPence(pence), style = style)
    }
}
