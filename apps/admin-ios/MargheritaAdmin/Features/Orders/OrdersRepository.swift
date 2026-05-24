import Foundation

@MainActor
final class OrdersRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func list() async -> ApiResult<[AdminOrderListItem]> { await api.get("/api/admin/orders") }
    func detail(id: String) async -> ApiResult<AdminOrderDetail> { await api.get("/api/admin/orders/\(id)") }
    func updateStatus(id: String, status: String) async -> ApiResult<AdminOrderDetail> {
        await api.post("/api/admin/orders/\(id)/status", body: UpdateOrderStatusBody(status: status))
    }
}
