package uk.margheritapizzeria.admin.bookings.data

import uk.margheritapizzeria.admin.bookings.model.AdminBookingDetail
import uk.margheritapizzeria.admin.bookings.model.AdminBookingListItem
import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall

class BookingsRepository(private val api: BookingsApi) {
    suspend fun list(): ApiResult<List<AdminBookingListItem>> = apiCall { api.list() }
    suspend fun detail(id: String): ApiResult<AdminBookingDetail> = apiCall { api.detail(id) }
    suspend fun updateStatus(id: String, status: String): ApiResult<AdminBookingDetail> =
        apiCall { api.updateStatus(id, UpdateBookingStatusBody(status)) }
}
