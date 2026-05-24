import Foundation

struct AdminDashboardStats: Decodable {
    let totalOrders: Int
    let totalOrderValuePence: Int
    let pendingOrders: Int
    let totalBookings: Int
    let pendingBookings: Int
    let latestOrders: [AdminOrderListItem]
    let latestBookings: [AdminBookingListItem]

    // Backend may also send a `revenueToday` figure — tolerated by missing.
    let revenueTodayPence: Int?
}
