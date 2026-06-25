import Foundation
import SwiftUI

enum AppTab: Hashable, CaseIterable {
    case dashboard, orders, bookings, menu, more

    var titleKey: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .orders:    return "Orders"
        case .bookings:  return "Bookings"
        case .menu:      return "Menu"
        case .more:      return "More"
        }
    }
    var systemImage: String {
        switch self {
        case .dashboard: return "rectangle.3.group.fill"
        case .orders:    return "bag.fill"
        case .bookings:  return "calendar"
        case .menu:      return "list.bullet.rectangle"
        case .more:      return "ellipsis.circle"
        }
    }
}

/// Per-tab stack path. We use a typed enum so cross-tab deep links
/// (e.g. alert → order detail) are unambiguous.
enum Route: Hashable {
    case orderDetail(String)
    case bookingDetail(String)
    case settings
    case images
    case discounts
    case forgotPassword
    case invoicesList
    case invoiceDetail(String)
}

/// Holds the current tab + per-tab navigation paths. Stored as an
/// `ObservableObject` so the alert layer can deep-link from anywhere.
@MainActor
final class RootRouter: ObservableObject {
    @Published var selectedTab: AppTab = .dashboard
    @Published var dashboardPath: [Route] = []
    @Published var ordersPath: [Route] = []
    @Published var bookingsPath: [Route] = []
    @Published var menuPath: [Route] = []
    @Published var morePath: [Route] = []

    func navigateToOrder(_ id: String) {
        selectedTab = .orders
        if ordersPath.last != .orderDetail(id) {
            ordersPath.append(.orderDetail(id))
        }
    }

    func navigateToBooking(_ id: String) {
        selectedTab = .bookings
        if bookingsPath.last != .bookingDetail(id) {
            bookingsPath.append(.bookingDetail(id))
        }
    }

    func openMore(_ route: Route) {
        selectedTab = .more
        morePath.append(route)
    }
}
