import Foundation

struct AdminDaySchedule: Codable, Equatable {
    var open: String = "11:00"
    var close: String = "23:00"
    var closed: Bool? = false
}

typealias AdminOpeningHours = [String: AdminDaySchedule]

struct AdminSettings: Codable, Equatable {
    var minDeliveryOrderPence: Int
    var deliveryFeePence: Int
    var prepTimeMinutes: Int
    var deliveryTimeMinutes: Int
    var depositEnabled: Bool
    var depositAmountPence: Int
    var openingHours: AdminOpeningHours
}

struct AdminSettingsInput: Encodable {
    let minDeliveryOrderPence: Int
    let deliveryFeePence: Int
    let prepTimeMinutes: Int
    let deliveryTimeMinutes: Int
    let depositEnabled: Bool
    let depositAmountPence: Int
    let openingHours: AdminOpeningHours
}

struct AdminTimeSlot: Codable, Identifiable, Equatable {
    let id: String
    var type: String
    var time: String
    var active: Bool
    let createdAt: String?
}

struct AdminTimeSlotInput: Encodable {
    let type: String
    let time: String
    let active: Bool
}

struct AdminTable: Codable, Identifiable, Equatable {
    let id: String
    var number: Int
    var maxCovers: Int
    var active: Bool
    let createdAt: String?
}

struct AdminTableUpdate: Encodable {
    let id: String
    let maxCovers: Int
    let active: Bool
}
