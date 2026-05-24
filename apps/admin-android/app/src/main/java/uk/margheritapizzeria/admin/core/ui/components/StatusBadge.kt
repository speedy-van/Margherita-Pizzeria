package uk.margheritapizzeria.admin.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Pill badge for order/booking status. Colours map directly to the
 * statuses defined in the backend so staff get the same visual cue
 * across web and mobile.
 */
@Composable
fun StatusBadge(label: String, kind: StatusKind, modifier: Modifier = Modifier) {
    val (bg, fg) = kind.colors()
    Text(
        text = label.replace('_', ' ').replaceFirstChar { it.uppercase() },
        style = MaterialTheme.typography.labelLarge,
        color = fg,
        modifier = modifier
            .background(color = bg, shape = RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    )
}

enum class StatusKind {
    Neutral, Info, Success, Warning, Danger, Inactive;

    @Composable
    fun colors(): Pair<Color, Color> = when (this) {
        Neutral -> MaterialTheme.colorScheme.surface to MaterialTheme.colorScheme.onSurface
        Info -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.onSecondaryContainer
        Success -> Color(0xFFD4EAD9) to Color(0xFF1F4A2C)
        Warning -> Color(0xFFFDE7C2) to Color(0xFF6A4500)
        Danger -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        Inactive -> Color(0xFFE4E4E4) to Color(0xFF555555)
    }
}

fun orderStatusKind(status: String): StatusKind = when (status) {
    "pending_payment" -> StatusKind.Warning
    "received" -> StatusKind.Info
    "making" -> StatusKind.Info
    "ready" -> StatusKind.Success
    "out_for_delivery" -> StatusKind.Success
    "delivered" -> StatusKind.Success
    "cancelled", "rejected" -> StatusKind.Danger
    else -> StatusKind.Neutral
}

fun bookingStatusKind(status: String): StatusKind = when (status) {
    "pending" -> StatusKind.Warning
    "confirmed" -> StatusKind.Success
    "completed" -> StatusKind.Info
    "cancelled", "rejected" -> StatusKind.Danger
    else -> StatusKind.Neutral
}
