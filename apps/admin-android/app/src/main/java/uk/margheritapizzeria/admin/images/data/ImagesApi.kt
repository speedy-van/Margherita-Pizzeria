package uk.margheritapizzeria.admin.images.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import uk.margheritapizzeria.admin.images.model.AdminImage
import uk.margheritapizzeria.admin.images.model.AdminImageUpdate

interface ImagesApi {
    @GET("api/admin/images")
    suspend fun list(): Response<ApiEnvelope<List<AdminImage>>>

    @PUT("api/admin/images/{id}")
    suspend fun update(
        @Path("id") id: String,
        @Body body: AdminImageUpdate,
    ): Response<ApiEnvelope<AdminImage>>
}
