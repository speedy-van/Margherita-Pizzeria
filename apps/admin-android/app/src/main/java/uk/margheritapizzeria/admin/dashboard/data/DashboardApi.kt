package uk.margheritapizzeria.admin.dashboard.data

import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.GET
import uk.margheritapizzeria.admin.bookings.model.AdminBookingListItem
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import uk.margheritapizzeria.admin.orders.model.AdminOrderListItem

@Serializable
data class AdminDashboardStats(
    val todayOrderCount: Int = 0,
    val todayBookingCount: Int = 0,
    val todayRevenuePence: Int = 0,
    val pendingBookingsCount: Int = 0,
    val activeMenuItemsCount: Int = 0,
    val unavailableMenuItemsCount: Int = 0,
    val latestOrders: List<AdminOrderListItem> = emptyList(),
    val latestBookings: List<AdminBookingListItem> = emptyList(),
    val generatedAt: String? = null,
)

interface DashboardApi {
    @GET("api/admin/dashboard")
    suspend fun get(): Response<ApiEnvelope<AdminDashboardStats>>
}
