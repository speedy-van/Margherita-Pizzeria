import Foundation

@MainActor
final class DashboardRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }
    func get() async -> ApiResult<AdminDashboardStats> {
        if api.isDemoMode { return .success(DemoData.dashboard()) }
        return await api.get("/api/admin/dashboard")
    }
}
