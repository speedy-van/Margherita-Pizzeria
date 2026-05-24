package uk.margheritapizzeria.admin.menu.model

import kotlinx.serialization.Serializable

@Serializable
data class AdminMenuCategory(
    val id: String,
    val name: String = "",
    val displayOrder: Int = 0,
    val active: Boolean = true,
    val createdAt: String = "",
)

@Serializable
data class AdminMenuItem(
    val id: String,
    val categoryId: String? = null,
    val name: String = "",
    val description: String? = null,
    val pricePence: Int = 0,
    val imageUrl: String? = null,
    val available: Boolean = true,
    val allergens: List<String> = emptyList(),
    val createdAt: String = "",
)

@Serializable
data class AdminMenuPayload(
    val categories: List<AdminMenuCategory> = emptyList(),
    val items: List<AdminMenuItem> = emptyList(),
)

@Serializable
data class MenuItemInput(
    val name: String,
    val description: String? = null,
    val pricePence: Int,
    val categoryId: String? = null,
    val imageUrl: String? = null,
    val available: Boolean = true,
    val allergens: List<String> = emptyList(),
)
