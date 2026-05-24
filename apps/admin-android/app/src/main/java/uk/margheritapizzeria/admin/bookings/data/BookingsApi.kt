package uk.margheritapizzeria.admin.bookings.data

import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import uk.margheritapizzeria.admin.bookings.model.AdminBookingDetail
import uk.margheritapizzeria.admin.bookings.model.AdminBookingListItem
import uk.margheritapizzeria.admin.core.network.ApiEnvelope

@Serializable
data class UpdateBookingStatusBody(val status: String)

interface BookingsApi {
    @GET("api/admin/bookings")
    suspend fun list(): Response<ApiEnvelope<List<AdminBookingListItem>>>

    @GET("api/admin/bookings/{id}")
    suspend fun detail(@Path("id") id: String): Response<ApiEnvelope<AdminBookingDetail>>

    @POST("api/admin/bookings/{id}/status")
    suspend fun updateStatus(
        @Path("id") id: String,
        @Body body: UpdateBookingStatusBody,
    ): Response<ApiEnvelope<AdminBookingDetail>>
}
