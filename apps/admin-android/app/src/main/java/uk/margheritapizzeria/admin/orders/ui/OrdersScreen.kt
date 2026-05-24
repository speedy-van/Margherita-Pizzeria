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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uk.margheritapizzeria.admin.core.ui.components.EmptyState
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.StatusBadge
import uk.margheritapizzeria.admin.core.ui.components.orderStatusKind
import uk.margheritapizzeria.admin.core.ui.format.formatPence
import uk.margheritapizzeria.admin.core.ui.format.formatShortDateTime
import uk.margheritapizzeria.admin.orders.model.AdminOrderListItem
import uk.margheritapizzeria.admin.orders.model.OrderStatuses

@Composable
fun OrdersScreen(
    viewModel: OrdersViewModel,
    onOpenOrder: (String) -> Unit,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = state.search,
            onValueChange = viewModel::setSearch,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            singleLine = true,
            label = { Text("Search by order id or name") },
        )
        FilterRow(
            label = "Type",
            options = listOf(null to "All", "delivery" to "Delivery", "collection" to "Collection"),
            selected = state.typeFilter,
            onSelect = viewModel::setTypeFilter,
        )
        FilterRow(
            label = "Status",
            options = buildList {
                add(null to "All")
                OrderStatuses.all.forEach { add(it to it.replace('_', ' ').replaceFirstChar { c -> c.uppercase() }) }
            },
            selected = state.statusFilter,
            onSelect = viewModel::setStatusFilter,
        )

        when {
            state.loading && state.all.isEmpty() -> LoadingState()
            state.error != null && state.all.isEmpty() -> ErrorState(
                message = state.error?.message ?: "",
                onRetry = viewModel::refresh,
            )
            state.visible.isEmpty() -> EmptyState(
                title = "No orders",
                message = "Nothing matches your filters yet.",
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.visible, key = { it.id }) { order ->
                    OrderRow(order, onClick = { onOpenOrder(order.id) })
                }
            }
        }
    }
}

@Composable
private fun FilterRow(
    label: String,
    options: List<Pair<String?, String>>,
    selected: String?,
    onSelect: (String?) -> Unit,
) {
    Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(4.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(options) { (value, displayLabel) ->
                FilterChip(
                    selected = selected == value,
                    onClick = { onSelect(value) },
                    label = { Text(displayLabel) },
                )
            }
        }
    }
}

@Composable
private fun OrderRow(order: AdminOrderListItem, onClick: () -> Unit) {
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
                        "#${order.reference ?: order.id.take(8).uppercase()}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        order.customerName.ifBlank { "Customer" },
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                StatusBadge(order.status, orderStatusKind(order.status))
            }
            Spacer(Modifier.height(4.dp))
            Text(
                "${order.type.replaceFirstChar { it.uppercase() }} · ${formatPence(order.totalPence)} · ${order.itemCount} item(s)",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                "Placed ${formatShortDateTime(order.createdAt)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
