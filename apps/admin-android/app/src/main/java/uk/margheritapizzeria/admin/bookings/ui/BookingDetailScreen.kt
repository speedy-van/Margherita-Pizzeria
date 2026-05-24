package uk.margheritapizzeria.admin.bookings.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
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
import uk.margheritapizzeria.admin.bookings.model.AdminBookingDetail
import uk.margheritapizzeria.admin.bookings.model.BookingStatuses
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.SectionCard
import uk.margheritapizzeria.admin.core.ui.components.StatusBadge
import uk.margheritapizzeria.admin.core.ui.components.bookingStatusKind
import uk.margheritapizzeria.admin.core.ui.format.formatShortDateTime

@Composable
fun BookingDetailScreen(viewModel: BookingDetailViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    when {
        state.loading -> LoadingState()
        state.error != null && state.data == null -> ErrorState(
            message = state.error?.message ?: "",
            onRetry = viewModel::load,
        )
        state.data != null -> BookingDetailContent(
            data = state.data!!,
            updating = state.updating,
            updateError = state.updateError,
            onUpdate = viewModel::updateStatus,
        )
    }
}

@Composable
private fun BookingDetailContent(
    data: AdminBookingDetail,
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
                        Modifier.fillMaxWidth(),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    ) {
                        Text(
                            "Booking #${data.reference ?: data.id.take(8).uppercase()}",
                            style = MaterialTheme.typography.titleLarge,
                            modifier = Modifier.weight(1f),
                        )
                        StatusBadge(data.status, bookingStatusKind(data.status))
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${data.date} · ${data.timeSlot} · ${data.covers} covers",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Text(
                        "Booked ${formatShortDateTime(data.createdAt)}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (data.depositPaid) {
                        Text("Deposit: PAID", color = MaterialTheme.colorScheme.primary)
                    } else {
                        Text("Deposit: not paid", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (!data.tableId.isNullOrBlank()) {
                        Text("Table ${data.tableId}")
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
                }
            }
        }

        item {
            SectionCard {
                Column {
                    Text("Update status", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(BookingStatuses.all) { status ->
                            val isCurrent = data.status == status
                            val isTerminal = status in BookingStatuses.terminal
                            AssistChip(
                                enabled = !updating && !isCurrent,
                                onClick = {
                                    if (isTerminal) pendingTerminal = status
                                    else onUpdate(status)
                                },
                                label = { Text(status.replaceFirstChar { it.uppercase() }) },
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
            text = { Text("Mark this booking as ${terminal}? Guests may be notified.") },
            confirmButton = {
                Button(onClick = { onUpdate(terminal); pendingTerminal = null }) { Text("Confirm") }
            },
            dismissButton = {
                TextButton(onClick = { pendingTerminal = null }) { Text("Cancel") }
            },
        )
    }
}
