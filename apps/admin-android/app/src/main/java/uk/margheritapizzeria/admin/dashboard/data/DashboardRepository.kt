package uk.margheritapizzeria.admin.dashboard.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall

class DashboardRepository(private val api: DashboardApi) {
    suspend fun load(): ApiResult<AdminDashboardStats> = apiCall { api.get() }
}
