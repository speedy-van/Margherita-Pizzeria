import Foundation

struct AdminDiscount: Codable, Identifiable, Equatable {
    let id: String
    var code: String
    var title: String
    var description: String?
    var type: String        // "percentage" | "fixed"
    var value: Int          // % or pence
    var minOrderPence: Int
    var startsAt: String?
    var endsAt: String?
    var active: Bool
    var appliesToDelivery: Bool
    var appliesToCollection: Bool
    let createdAt: String?
    let updatedAt: String?
}

struct DiscountInput: Encodable {
    let code: String
    let title: String
    let description: String?
    let type: String
    let value: Int
    let minOrderPence: Int
    let startsAt: String?
    let endsAt: String?
    let active: Bool
    let appliesToDelivery: Bool
    let appliesToCollection: Bool
}

struct DiscountDeleteResponse: Decodable {
    let key: String?
    let id: String?
}

@MainActor
final class DiscountsRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func list() async -> ApiResult<[AdminDiscount]> { await api.get("/api/admin/discounts") }
    func create(_ input: DiscountInput) async -> ApiResult<AdminDiscount> {
        await api.post("/api/admin/discounts", body: input)
    }
    func update(id: String, _ input: DiscountInput) async -> ApiResult<AdminDiscount> {
        await api.put("/api/admin/discounts/\(id)", body: input)
    }
    func delete(id: String) async -> ApiResult<DiscountDeleteResponse> {
        await api.delete("/api/admin/discounts/\(id)")
    }
}
