package uk.margheritapizzeria.admin.images.model

import kotlinx.serialization.Serializable

@Serializable
data class AdminImage(
    val id: String,
    val label: String = "",
    val url: String = "",
    val section: String = "",
    val updatedAt: String = "",
)

@Serializable
data class AdminImageUpdate(val url: String)
