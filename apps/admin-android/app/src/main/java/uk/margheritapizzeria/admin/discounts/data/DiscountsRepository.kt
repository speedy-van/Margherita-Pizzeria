package uk.margheritapizzeria.admin.discounts.data

import uk.margheritapizzeria.admin.core.network.ApiResult
import uk.margheritapizzeria.admin.core.network.apiCall
import uk.margheritapizzeria.admin.discounts.model.AdminDiscount
import uk.margheritapizzeria.admin.discounts.model.DiscountInput

class DiscountsRepository(private val api: DiscountsApi) {
    suspend fun list(): ApiResult<List<AdminDiscount>> = apiCall { api.list() }
    suspend fun create(input: DiscountInput): ApiResult<AdminDiscount> =
        apiCall { api.create(input) }
    suspend fun update(id: String, input: DiscountInput): ApiResult<AdminDiscount> =
        apiCall { api.update(id, input) }
    suspend fun delete(id: String): ApiResult<Map<String, String>> =
        apiCall { api.delete(id) }
}
