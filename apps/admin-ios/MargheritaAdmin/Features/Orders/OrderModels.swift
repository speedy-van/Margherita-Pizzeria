import Foundation

struct AdminOrderListItem: Decodable, Identifiable, Equatable {
    let id: String
    let reference: String?
    let type: String            // "delivery" | "collection"
    let status: String
    let customerName: String?
    let customerEmail: String?
    let customerPhone: String?
    let totalPence: Int
    let paymentMethod: String?
    let itemCount: Int?
    let createdAt: String
    let updatedAt: String?
}

struct OrderItemSnapshot: Decodable, Identifiable, Equatable {
    let id: String?
    let name: String
    let pricePence: Int
    let quantity: Int
    let notes: String?

    var stableId: String { id ?? "\(name)-\(pricePence)-\(quantity)" }
    var identityId: String { stableId }
}

struct AdminOrderDetail: Decodable, Equatable {
    let id: String
    let reference: String?
    let type: String
    let status: String
    let customerName: String?
    let customerEmail: String?
    let customerPhone: String?
    let address: String?
    let totalPence: Int
    let subtotalPence: Int
    let deliveryFeePence: Int
    let discountPence: Int
    let discountCode: String?
    let paymentMethod: String?
    let items: [OrderItemSnapshot]
    let estimatedTime: String?
    let createdAt: String
    let updatedAt: String?
    let notes: String?
}

struct UpdateOrderStatusBody: Encodable { let status: String }

enum OrderStatuses {
    static let all: [String] = [
        "pending_payment", "received", "making",
        "ready", "out_for_delivery", "delivered",
        "cancelled", "rejected",
    ]
    /// Next-step suggestions per current status.
    static func nextOptions(for current: String, type: String) -> [String] {
        switch current.lowercased() {
        case "pending_payment":
            return ["received", "cancelled"]
        case "received":
            return ["making", "cancelled", "rejected"]
        case "making":
            return ["ready", "cancelled"]
        case "ready":
            return type == "delivery" ? ["out_for_delivery", "cancelled"] : ["delivered", "cancelled"]
        case "out_for_delivery":
            return ["delivered", "cancelled"]
        case "delivered", "cancelled", "rejected":
            return []
        default:
            return all
        }
    }
}
