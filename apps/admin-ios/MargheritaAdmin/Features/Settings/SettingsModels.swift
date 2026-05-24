import Foundation

struct AdminDaySchedule: Codable, Equatable {
    var isOpen: Bool
    var opensAt: String?
    var closesAt: String?
}

typealias AdminOpeningHours = [String: AdminDaySchedule]

struct AdminSettings: Codable, Equatable {
    var deliveryFeeBasePence: Int
    var freeDeliveryThresholdPence: Int
    var openingHours: AdminOpeningHours
    var description: String?
}

struct AdminSettingsInput: Encodable {
    let deliveryFeeBasePence: Int
    let freeDeliveryThresholdPence: Int
    let openingHours: AdminOpeningHours
    let description: String?
}

struct AdminTimeSlot: Codable, Identifiable, Equatable {
    let id: String
    var startTime: String
    var endTime: String
    var seats: Int
    var active: Bool
    let createdAt: String?
}

struct AdminTimeSlotInput: Encodable {
    let startTime: String
    let endTime: String
    let seats: Int
}

struct AdminTable: Codable, Identifiable, Equatable {
    let id: String
    var number: Int
    var seats: Int
    var active: Bool
    let createdAt: String?
}

struct AdminTableUpdate: Encodable {
    let id: String
    let seats: Int
    let active: Bool
}
