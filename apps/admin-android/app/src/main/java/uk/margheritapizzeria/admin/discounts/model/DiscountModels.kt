package uk.margheritapizzeria.admin.discounts.model

import kotlinx.serialization.Serializable

@Serializable
data class AdminDiscount(
    val id: String,
    val code: String,
    val title: String = "",
    val description: String? = null,
    val type: String = "percentage", // "percentage" | "fixed"
    val value: Int = 0,
    val minOrderPence: Int = 0,
    val startsAt: String? = null,
    val endsAt: String? = null,
    val active: Boolean = true,
    val appliesToDelivery: Boolean = true,
    val appliesToCollection: Boolean = true,
    val createdAt: String = "",
    val updatedAt: String = "",
)

@Serializable
data class DiscountInput(
    val code: String,
    val title: String,
    val description: String? = null,
    val type: String,
    val value: Int,
    val minOrderPence: Int = 0,
    val startsAt: String? = null,
    val endsAt: String? = null,
    val active: Boolean = true,
    val appliesToDelivery: Boolean = true,
    val appliesToCollection: Boolean = true,
)
