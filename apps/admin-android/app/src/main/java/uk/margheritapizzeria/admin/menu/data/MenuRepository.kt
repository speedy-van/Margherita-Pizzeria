package uk.margheritapizzeria.admin.menu.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall
import uk.margheritapizzeria.admin.menu.model.AdminMenuItem
import uk.margheritapizzeria.admin.menu.model.AdminMenuPayload
import uk.margheritapizzeria.admin.menu.model.MenuItemInput

class MenuRepository(private val api: MenuAdminApi) {
    suspend fun load(): ApiResult<AdminMenuPayload> = apiCall { api.getMenu() }
    suspend fun create(input: MenuItemInput): ApiResult<AdminMenuItem> =
        apiCall { api.createItem(input) }
    suspend fun update(id: String, input: MenuItemInput): ApiResult<AdminMenuItem> =
        apiCall { api.updateItem(id, input) }
    suspend fun delete(id: String): ApiResult<Map<String, String>> =
        apiCall { api.deleteItem(id) }
}
