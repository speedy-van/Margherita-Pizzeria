import Foundation

struct AdminImage: Codable, Identifiable, Equatable {
    let id: String
    let label: String
    let url: String?
    let section: String?
    let updatedAt: String?
}

struct AdminImageUpdate: Encodable { let url: String }

@MainActor
final class ImagesRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }
    func list() async -> ApiResult<[AdminImage]> { await api.get("/api/admin/images") }
    func update(id: String, url: String) async -> ApiResult<AdminImage> {
        await api.put("/api/admin/images/\(id)", body: AdminImageUpdate(url: url))
    }
}
