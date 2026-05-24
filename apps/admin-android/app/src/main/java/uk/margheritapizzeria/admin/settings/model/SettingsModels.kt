package uk.margheritapizzeria.admin.settings.model

import kotlinx.serialization.Serializable

@Serializable
data class AdminDaySchedule(
    val open: String = "09:00",
    val close: String = "22:00",
    val closed: Boolean? = false,
)

@Serializable
data class AdminOpeningHours(
    val monday: AdminDaySchedule = AdminDaySchedule(),
    val tuesday: AdminDaySchedule = AdminDaySchedule(),
    val wednesday: AdminDaySchedule = AdminDaySchedule(),
    val thursday: AdminDaySchedule = AdminDaySchedule(),
    val friday: AdminDaySchedule = AdminDaySchedule(),
    val saturday: AdminDaySchedule = AdminDaySchedule(),
    val sunday: AdminDaySchedule = AdminDaySchedule(),
)

@Serializable
data class AdminSettings(
    val minDeliveryOrderPence: Int = 0,
    val deliveryFeePence: Int = 0,
    val prepTimeMinutes: Int = 0,
    val deliveryTimeMinutes: Int = 0,
    val depositEnabled: Boolean = false,
    val depositAmountPence: Int = 0,
    val openingHours: AdminOpeningHours = AdminOpeningHours(),
)

@Serializable
data class AdminSettingsInput(
    val minDeliveryOrderPence: Int,
    val deliveryFeePence: Int,
    val prepTimeMinutes: Int,
    val deliveryTimeMinutes: Int,
    val depositEnabled: Boolean,
    val depositAmountPence: Int,
    val openingHours: AdminOpeningHours,
)

@Serializable
data class AdminTimeSlot(
    val id: String,
    val type: String,
    val time: String = "",
    val active: Boolean = true,
    val createdAt: String = "",
)

@Serializable
data class AdminTimeSlotInput(
    val type: String,
    val time: String,
    val active: Boolean = true,
)

@Serializable
data class AdminTable(
    val id: String,
    val number: Int = 0,
    val maxCovers: Int = 0,
    val active: Boolean = true,
    val createdAt: String = "",
)

@Serializable
data class AdminTableUpdate(
    val id: String,
    val maxCovers: Int? = null,
    val active: Boolean? = null,
)
