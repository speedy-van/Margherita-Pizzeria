package uk.margheritapizzeria.admin.dashboard.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import uk.margheritapizzeria.admin.bookings.model.AdminBookingListItem
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.SectionCard
import uk.margheritapizzeria.admin.core.ui.components.StatusBadge
import uk.margheritapizzeria.admin.core.ui.components.bookingStatusKind
import uk.margheritapizzeria.admin.core.ui.components.orderStatusKind
import uk.margheritapizzeria.admin.core.ui.format.formatPence
import uk.margheritapizzeria.admin.core.ui.format.formatShortDateTime
import uk.margheritapizzeria.admin.orders.model.AdminOrderListItem

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onOpenOrder: (String) -> Unit,
    onOpenBooking: (String) -> Unit,
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(lifecycleOwner, viewModel) {
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            viewModel.refresh(silent = true)
            while (isActive) {
                delay(5000)
                viewModel.refresh(silent = true)
            }
        }
    }

    when (val s = state) {
        is DashboardUiState.Loading -> LoadingState()
        is DashboardUiState.Error -> ErrorState(
            message = s.failure.message,
            onRetry = { viewModel.refresh() },
        )
        is DashboardUiState.Ready -> DashboardContent(
            data = s.data,
            onRefresh = { viewModel.refresh() },
            onOpenOrder = onOpenOrder,
            onOpenBooking = onOpenBooking,
        )
    }
}

@Composable
private fun DashboardContent(
    data: uk.margheritapizzeria.admin.dashboard.data.AdminDashboardStats,
    onRefresh: () -> Unit,
    onOpenOrder: (String) -> Unit,
    onOpenBooking: (String) -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text("Today", style = MaterialTheme.typography.titleLarge)
        }
        item {
            StatRow(
                left = StatTile("Orders today", data.todayOrderCount.toString()),
                right = StatTile("Revenue today", formatPence(data.todayRevenuePence)),
            )
        }
        item {
            StatRow(
                left = StatTile("Bookings today", data.todayBookingCount.toString()),
                right = StatTile("Pending bookings", data.pendingBookingsCount.toString()),
            )
        }
        item {
            StatRow(
                left = StatTile("Active items", data.activeMenuItemsCount.toString()),
                right = StatTile("Unavailable", data.unavailableMenuItemsCount.toString()),
            )
        }

        item { Spacer(Modifier.height(8.dp)) }
        item { Text("Latest orders", style = MaterialTheme.typography.titleMedium) }
        if (data.latestOrders.isEmpty()) {
            item {
                SectionCard {
                    Text(
                        "No orders yet.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        } else {
            items(data.latestOrders, key = { it.id }) { order ->
                OrderSummaryCard(order = order, onClick = { onOpenOrder(order.id) })
            }
        }

        item { Spacer(Modifier.height(8.dp)) }
        item { Text("Latest bookings", style = MaterialTheme.typography.titleMedium) }
        if (data.latestBookings.isEmpty()) {
            item {
                SectionCard {
                    Text(
                        "No bookings yet.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        } else {
            items(data.latestBookings, key = { it.id }) { booking ->
                BookingSummaryCard(booking = booking, onClick = { onOpenBooking(booking.id) })
            }
        }

        item {
            Spacer(Modifier.height(8.dp))
            androidx.compose.material3.TextButton(onClick = onRefresh) {
                Text("Refresh")
            }
            Text(
                "Updated ${formatShortDateTime(data.generatedAt)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private data class StatTile(val label: String, val value: String)

@Composable
private fun StatRow(left: StatTile, right: StatTile) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        StatCard(left, Modifier.weight(1f))
        StatCard(right, Modifier.weight(1f))
    }
}

@Composable
private fun StatCard(tile: StatTile, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                tile.label,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                tile.value,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}

@Composable
private fun OrderSummaryCard(order: AdminOrderListItem, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        onClick = onClick,
    ) {
        Column(Modifier.padding(14.dp)) {
            Box(Modifier.fillMaxWidth()) {
                Text(
                    order.customerName.ifBlank { "Customer" },
                    style = MaterialTheme.typography.titleMedium,
                )
                Box(Modifier.fillMaxWidth(), contentAlignment = androidx.compose.ui.Alignment.CenterEnd) {
                    StatusBadge(order.status, orderStatusKind(order.status))
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                "${order.type.replaceFirstChar { it.uppercase() }} · ${formatPence(order.totalPence)} · ${order.itemCount} item(s)",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                formatShortDateTime(order.createdAt),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun BookingSummaryCard(booking: AdminBookingListItem, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        onClick = onClick,
    ) {
        Column(Modifier.padding(14.dp)) {
            Box(Modifier.fillMaxWidth()) {
                Text(
                    booking.customerName.ifBlank { "Guest" },
                    style = MaterialTheme.typography.titleMedium,
                )
                Box(Modifier.fillMaxWidth(), contentAlignment = androidx.compose.ui.Alignment.CenterEnd) {
                    StatusBadge(booking.status, bookingStatusKind(booking.status))
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                "${booking.date} · ${booking.timeSlot} · ${booking.covers} covers",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
