package uk.margheritapizzeria.admin.discounts.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import uk.margheritapizzeria.admin.discounts.model.AdminDiscount
import uk.margheritapizzeria.admin.discounts.model.DiscountInput

interface DiscountsApi {
    @GET("api/admin/discounts")
    suspend fun list(): Response<ApiEnvelope<List<AdminDiscount>>>

    @POST("api/admin/discounts")
    suspend fun create(@Body body: DiscountInput): Response<ApiEnvelope<AdminDiscount>>

    @PUT("api/admin/discounts/{id}")
    suspend fun update(
        @Path("id") id: String,
        @Body body: DiscountInput,
    ): Response<ApiEnvelope<AdminDiscount>>

    @DELETE("api/admin/discounts/{id}")
    suspend fun delete(@Path("id") id: String): Response<ApiEnvelope<Map<String, String>>>
}
