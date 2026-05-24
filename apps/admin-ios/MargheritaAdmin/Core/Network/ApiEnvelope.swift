import Foundation

/// Mirrors backend `ApiEnvelope` (`{ ok, data?, error? }`).
struct ApiEnvelope<T: Decodable>: Decodable {
    let ok: Bool
    let data: T?
    let error: ApiErrorBody?
}

struct ApiErrorBody: Decodable {
    let code: String?
    let message: String?
    let fields: [String: String]?
}
