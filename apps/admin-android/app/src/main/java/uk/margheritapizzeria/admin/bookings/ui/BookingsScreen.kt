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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uk.margheritapizzeria.admin.bookings.model.AdminBookingListItem
import uk.margheritapizzeria.admin.bookings.model.BookingStatuses
import uk.margheritapizzeria.admin.core.ui.components.EmptyState
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.StatusBadge
import uk.margheritapizzeria.admin.core.ui.components.bookingStatusKind

@Composable
fun BookingsScreen(
    viewModel: BookingsViewModel,
    onOpenBooking: (String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        Text(
            "Status",
            modifier = Modifier.padding(start = 16.dp, top = 12.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        LazyRow(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            val options = buildList {
                add(null to "All")
                BookingStatuses.all.forEach { add(it to it.replaceFirstChar { c -> c.uppercase() }) }
            }
            items(options) { (value, label) ->
                FilterChip(
                    selected = state.statusFilter == value,
                    onClick = { viewModel.setStatusFilter(value) },
                    label = { Text(label) },
                )
            }
        }
        Spacer(Modifier.height(4.dp))

        when {
            state.loading && state.all.isEmpty() -> LoadingState()
            state.error != null && state.all.isEmpty() -> ErrorState(
                message = state.error?.message ?: "",
                onRetry = viewModel::refresh,
            )
            state.visible.isEmpty() -> EmptyState(
                title = "No bookings",
                message = "Nothing matches your filters yet.",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.visible, key = { it.id }) { booking ->
                    BookingRow(booking, onClick = { onOpenBooking(booking.id) })
                }
            }
        }
    }
}

@Composable
private fun BookingRow(booking: AdminBookingListItem, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        onClick = onClick,
    ) {
        Column(Modifier.padding(14.dp)) {
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "#${booking.reference ?: booking.id.take(8).uppercase()}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        booking.customerName.ifBlank { "Guest" },
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                StatusBadge(booking.status, bookingStatusKind(booking.status))
            }
            Spacer(Modifier.height(4.dp))
            Text(
                "${booking.date} · ${booking.timeSlot} · ${booking.covers} covers",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (booking.depositPaid) {
                Text(
                    "Deposit paid",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}
