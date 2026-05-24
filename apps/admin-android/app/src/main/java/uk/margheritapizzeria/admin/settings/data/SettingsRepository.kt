package uk.margheritapizzeria.admin.settings.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall
import uk.margheritapizzeria.admin.settings.model.AdminSettings
import uk.margheritapizzeria.admin.settings.model.AdminSettingsInput
import uk.margheritapizzeria.admin.settings.model.AdminTable
import uk.margheritapizzeria.admin.settings.model.AdminTableUpdate
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlot
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlotInput

class SettingsRepository(private val api: SettingsApi) {
    suspend fun getSettings(): ApiResult<AdminSettings> = apiCall { api.getSettings() }
    suspend fun updateSettings(input: AdminSettingsInput): ApiResult<AdminSettings> =
        apiCall { api.updateSettings(input) }
    suspend fun listTimeSlots(): ApiResult<List<AdminTimeSlot>> =
        apiCall { api.listTimeSlots() }
    suspend fun createTimeSlot(input: AdminTimeSlotInput): ApiResult<AdminTimeSlot> =
        apiCall { api.createTimeSlot(input) }
    suspend fun updateTimeSlot(slot: AdminTimeSlot): ApiResult<AdminTimeSlot> =
        apiCall { api.updateTimeSlot(slot) }
    suspend fun listTables(): ApiResult<List<AdminTable>> =
        apiCall { api.listTables() }
    suspend fun updateTable(update: AdminTableUpdate): ApiResult<AdminTable> =
        apiCall { api.updateTable(update) }
}
