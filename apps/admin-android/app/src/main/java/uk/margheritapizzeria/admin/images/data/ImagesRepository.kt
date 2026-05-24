package uk.margheritapizzeria.admin.images.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall
import uk.margheritapizzeria.admin.images.model.AdminImage
import uk.margheritapizzeria.admin.images.model.AdminImageUpdate

class ImagesRepository(private val api: ImagesApi) {
    suspend fun list(): ApiResult<List<AdminImage>> = apiCall { api.list() }
    suspend fun update(id: String, url: String): ApiResult<AdminImage> =
        apiCall { api.update(id, AdminImageUpdate(url)) }
}
