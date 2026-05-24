package uk.margheritapizzeria.admin.orders.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall
import uk.margheritapizzeria.admin.orders.model.AdminOrderDetail
import uk.margheritapizzeria.admin.orders.model.AdminOrderListItem

class OrdersRepository(private val api: OrdersApi) {
    suspend fun list(): ApiResult<List<AdminOrderListItem>> = apiCall { api.list() }
    suspend fun detail(id: String): ApiResult<AdminOrderDetail> = apiCall { api.detail(id) }
    suspend fun updateStatus(id: String, status: String): ApiResult<AdminOrderDetail> =
        apiCall { api.updateStatus(id, UpdateOrderStatusBody(status)) }
}
