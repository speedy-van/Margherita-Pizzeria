import Foundation

struct AdminBookingListItem: Decodable, Identifiable, Equatable {
    let id: String
    let reference: String?
    let date: String          // ISO date
    let timeSlot: String      // "18:00" etc
    let covers: Int
    let status: String
    let depositPaid: Bool?
    let customerName: String?
    let customerEmail: String?
    let customerPhone: String?
    let createdAt: String
    let updatedAt: String?
}

struct AdminBookingDetail: Decodable, Equatable {
    let id: String
    let reference: String?
    let date: String
    let timeSlot: String
    let covers: Int
    let status: String
    let depositPaid: Bool?
    let depositPence: Int?
    let customerName: String?
    let customerEmail: String?
    let customerPhone: String?
    let tableId: String?
    let notes: String?
    let createdAt: String
    let updatedAt: String?
}

struct UpdateBookingStatusBody: Encodable { let status: String }

enum BookingStatuses {
    static let all: [String] = [
        "pending", "confirmed", "seated", "completed", "cancelled", "rejected", "no_show",
    ]
    static func nextOptions(for current: String) -> [String] {
        switch current.lowercased() {
        case "pending":   return ["confirmed", "rejected"]
        case "confirmed": return ["seated", "cancelled", "no_show"]
        case "seated":    return ["completed"]
        default:          return []
        }
    }
}
