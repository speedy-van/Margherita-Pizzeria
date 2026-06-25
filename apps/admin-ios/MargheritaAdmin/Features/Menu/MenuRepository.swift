import Foundation

@MainActor
final class MenuRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func payload() async -> ApiResult<AdminMenuPayload> {
        if api.isDemoMode { return .success(DemoData.menuPayload()) }
        return await api.get("/api/admin/menu/categories")
    }

    func createItem(_ input: MenuItemInput) async -> ApiResult<AdminMenuItem> {
        if api.isDemoMode { return .success(DemoData.saveMenuItem(id: nil, input: input)) }
        await api.post("/api/admin/menu/items", body: input)
    }

    func updateItem(id: String, _ input: MenuItemInput) async -> ApiResult<AdminMenuItem> {
        if api.isDemoMode { return .success(DemoData.saveMenuItem(id: id, input: input)) }
        await api.put("/api/admin/menu/items/\(id)", body: input)
    }

    func deleteItem(id: String) async -> ApiResult<MenuDeleteResponse> {
        if api.isDemoMode { return .success(DemoData.deleteMenuItem(id: id)) }
        await api.delete("/api/admin/menu/items/\(id)")
    }
}
