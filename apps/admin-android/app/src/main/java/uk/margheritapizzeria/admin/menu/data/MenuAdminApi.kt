package uk.margheritapizzeria.admin.menu.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import uk.margheritapizzeria.admin.core.network.ApiEnvelope
import uk.margheritapizzeria.admin.menu.model.AdminMenuItem
import uk.margheritapizzeria.admin.menu.model.AdminMenuPayload
import uk.margheritapizzeria.admin.menu.model.MenuItemInput

interface MenuAdminApi {
    @GET("api/admin/menu/categories")
    suspend fun getMenu(): Response<ApiEnvelope<AdminMenuPayload>>

    @POST("api/admin/menu/items")
    suspend fun createItem(@Body body: MenuItemInput): Response<ApiEnvelope<AdminMenuItem>>

    @PUT("api/admin/menu/items/{id}")
    suspend fun updateItem(
        @Path("id") id: String,
        @Body body: MenuItemInput,
    ): Response<ApiEnvelope<AdminMenuItem>>

    @DELETE("api/admin/menu/items/{id}")
    suspend fun deleteItem(@Path("id") id: String): Response<ApiEnvelope<Map<String, String>>>
}
