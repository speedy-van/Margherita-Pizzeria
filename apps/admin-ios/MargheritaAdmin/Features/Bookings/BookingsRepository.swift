import Foundation

@MainActor
final class BookingsRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func list() async -> ApiResult<[AdminBookingListItem]> {
        if api.isDemoMode { return .success(DemoData.bookingList()) }
        return await api.get("/api/admin/bookings")
    }

    func detail(id: String) async -> ApiResult<AdminBookingDetail> {
        if api.isDemoMode {
            guard let booking = DemoData.bookingDetail(id: id) else { return .failure(.notFound) }
            return .success(booking)
        }
        return await api.get("/api/admin/bookings/\(id)")
    }

    func updateStatus(id: String, status: String) async -> ApiResult<AdminBookingDetail> {
        if api.isDemoMode {
            guard let booking = DemoData.updateBooking(id: id, status: status) else { return .failure(.notFound) }
            return .success(booking)
        }
        await api.post("/api/admin/bookings/\(id)/status", body: UpdateBookingStatusBody(status: status))
    }
}
