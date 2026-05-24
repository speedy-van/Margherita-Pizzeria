import Foundation

struct AdminMenuCategory: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let displayOrder: Int
    let active: Bool
    let createdAt: String?
}

struct AdminMenuItem: Codable, Identifiable, Equatable {
    let id: String
    let categoryId: String?
    let name: String
    let description: String?
    let pricePence: Int
    let imageUrl: String?
    let available: Bool
    let allergens: [String]?
    let createdAt: String?
}

struct AdminMenuPayload: Decodable {
    let categories: [AdminMenuCategory]
    let items: [AdminMenuItem]
}

struct MenuItemInput: Encodable {
    let name: String
    let description: String?
    let pricePence: Int
    let categoryId: String?
    let imageUrl: String?
    let available: Bool
    let allergens: [String]
}

struct MenuDeleteResponse: Decodable {
    let key: String?
    let id: String?
}
