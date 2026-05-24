import Foundation

@MainActor
final class BookingsRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }
    func list() async -> ApiResult<[AdminBookingListItem]> { await api.get("/api/admin/bookings") }
    func detail(id: String) async -> ApiResult<AdminBookingDetail> { await api.get("/api/admin/bookings/\(id)") }
    func updateStatus(id: String, status: String) async -> ApiResult<AdminBookingDetail> {
        await api.post("/api/admin/bookings/\(id)/status", body: UpdateBookingStatusBody(status: status))
    }
}
