package uk.margheritapizzeria.admin.orders.data

import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import uk.margheritapizzeria.admin.orders.model.AdminOrderDetail
import uk.margheritapizzeria.admin.orders.model.AdminOrderListItem

@Serializable
data class UpdateOrderStatusBody(val status: String)

interface OrdersApi {
    @GET("api/admin/orders")
    suspend fun list(): Response<ApiEnvelope<List<AdminOrderListItem>>>

    @GET("api/admin/orders/{id}")
    suspend fun detail(@Path("id") id: String): Response<ApiEnvelope<AdminOrderDetail>>

    @POST("api/admin/orders/{id}/status")
    suspend fun updateStatus(
        @Path("id") id: String,
        @Body body: UpdateOrderStatusBody,
    ): Response<ApiEnvelope<AdminOrderDetail>>
}
