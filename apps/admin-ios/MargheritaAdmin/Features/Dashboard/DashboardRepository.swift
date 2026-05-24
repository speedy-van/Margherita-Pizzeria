import Foundation

@MainActor
final class DashboardRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }
    func get() async -> ApiResult<AdminDashboardStats> { await api.get("/api/admin/dashboard") }
}
