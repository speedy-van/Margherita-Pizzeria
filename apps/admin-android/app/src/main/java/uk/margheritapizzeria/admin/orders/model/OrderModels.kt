package uk.margheritapizzeria.admin.orders.model

import kotlinx.serialization.Serializable

@Serializable
data class AdminOrderListItem(
    val id: String,
    val reference: String? = null,
    val type: String,
    val status: String,
    val customerName: String = "",
    val customerEmail: String = "",
    val customerPhone: String = "",
    val totalPence: Int = 0,
    val paymentMethod: String = "",
    val itemCount: Int = 0,
    val createdAt: String = "",
    val updatedAt: String = "",
)

@Serializable
data class OrderItemSnapshot(
    val id: String? = null,
    val name: String = "",
    val pricePence: Int = 0,
    val quantity: Int = 1,
    val notes: String? = null,
)

@Serializable
data class AdminOrderDetail(
    val id: String,
    val reference: String? = null,
    val type: String,
    val status: String,
    val customerName: String = "",
    val customerEmail: String = "",
    val customerPhone: String = "",
    val totalPence: Int = 0,
    val paymentMethod: String = "",
    val itemCount: Int = 0,
    val createdAt: String = "",
    val updatedAt: String = "",
    val address: String? = null,
    val subtotalPence: Int = 0,
    val deliveryFeePence: Int = 0,
    val discountPence: Int = 0,
    val discountCode: String? = null,
    val items: List<OrderItemSnapshot> = emptyList(),
    val estimatedTime: String? = null,
)

object OrderStatuses {
    val all = listOf(
        "received",
        "making",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "rejected",
    )
    val terminal = setOf("delivered", "cancelled", "rejected")
}
