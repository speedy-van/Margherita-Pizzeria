import Foundation

@MainActor
final class MenuRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func payload() async -> ApiResult<AdminMenuPayload> { await api.get("/api/admin/menu/categories") }
    func createItem(_ input: MenuItemInput) async -> ApiResult<AdminMenuItem> {
        await api.post("/api/admin/menu/items", body: input)
    }
    func updateItem(id: String, _ input: MenuItemInput) async -> ApiResult<AdminMenuItem> {
        await api.put("/api/admin/menu/items/\(id)", body: input)
    }
    func deleteItem(id: String) async -> ApiResult<MenuDeleteResponse> {
        await api.delete("/api/admin/menu/items/\(id)")
    }
}
