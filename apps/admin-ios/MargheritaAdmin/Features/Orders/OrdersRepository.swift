import Foundation

@MainActor
final class OrdersRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func list() async -> ApiResult<[AdminOrderListItem]> {
        if api.isDemoMode { return .success(DemoData.orderList()) }
        return await api.get("/api/admin/orders")
    }

    func detail(id: String) async -> ApiResult<AdminOrderDetail> {
        if api.isDemoMode {
            guard let order = DemoData.orderDetail(id: id) else { return .failure(.notFound) }
            return .success(order)
        }
        return await api.get("/api/admin/orders/\(id)")
    }

    func updateStatus(id: String, status: String) async -> ApiResult<AdminOrderDetail> {
        if api.isDemoMode {
            guard let order = DemoData.updateOrder(id: id, status: status) else { return .failure(.notFound) }
            return .success(order)
        }
        await api.post("/api/admin/orders/\(id)/status", body: UpdateOrderStatusBody(status: status))
    }
}
