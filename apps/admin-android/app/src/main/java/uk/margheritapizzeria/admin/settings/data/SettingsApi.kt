package uk.margheritapizzeria.admin.settings.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import uk.margheritapizzeria.admin.settings.model.AdminSettings
import uk.margheritapizzeria.admin.settings.model.AdminSettingsInput
import uk.margheritapizzeria.admin.settings.model.AdminTable
import uk.margheritapizzeria.admin.settings.model.AdminTableUpdate
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlot
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlotInput

interface SettingsApi {
    @GET("api/admin/settings")
    suspend fun getSettings(): Response<ApiEnvelope<AdminSettings>>

    @PUT("api/admin/settings")
    suspend fun updateSettings(@Body body: AdminSettingsInput): Response<ApiEnvelope<AdminSettings>>

    @GET("api/admin/time-slots")
    suspend fun listTimeSlots(): Response<ApiEnvelope<List<AdminTimeSlot>>>

    @POST("api/admin/time-slots")
    suspend fun createTimeSlot(@Body body: AdminTimeSlotInput): Response<ApiEnvelope<AdminTimeSlot>>

    @PUT("api/admin/time-slots")
    suspend fun updateTimeSlot(@Body body: AdminTimeSlot): Response<ApiEnvelope<AdminTimeSlot>>

    @GET("api/admin/tables")
    suspend fun listTables(): Response<ApiEnvelope<List<AdminTable>>>

    @PUT("api/admin/tables")
    suspend fun updateTable(@Body body: AdminTableUpdate): Response<ApiEnvelope<AdminTable>>
}
