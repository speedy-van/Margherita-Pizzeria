package uk.margheritapizzeria.admin.bookings.model

import kotlinx.serialization.Serializable

@Serializable
data class AdminBookingListItem(
    val id: String,
    val reference: String? = null,
    val date: String = "",
    val timeSlot: String = "",
    val covers: Int = 0,
    val status: String,
    val depositPaid: Boolean = false,
    val customerName: String = "",
    val customerEmail: String = "",
    val customerPhone: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
)

@Serializable
data class AdminBookingDetail(
    val id: String,
    val reference: String? = null,
    val date: String = "",
    val timeSlot: String = "",
    val covers: Int = 0,
    val status: String,
    val depositPaid: Boolean = false,
    val customerName: String = "",
    val customerEmail: String = "",
    val customerPhone: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
    val tableId: String? = null,
)

object BookingStatuses {
    val all = listOf("pending", "confirmed", "rejected", "cancelled", "completed")
    val terminal = setOf("rejected", "cancelled", "completed")
}
