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
        "received", "pending_payment", "preparing",
        "ready", "out_for_delivery",
        "completed", "delivered",
        "cancelled", "refunded",
    ]
    /// Next-step suggestions per current status.
    static func nextOptions(for current: String, type: String) -> [String] {
        switch current.lowercased() {
        case "received", "pending_payment":
            return ["preparing", "cancelled"]
        case "preparing":
            return type == "delivery" ? ["out_for_delivery", "cancelled"] : ["ready", "cancelled"]
        case "ready":
            return ["completed", "cancelled"]
        case "out_for_delivery":
            return ["delivered", "cancelled"]
        case "completed", "delivered", "cancelled", "refunded":
            return []
        default:
            return all
        }
    }
}
