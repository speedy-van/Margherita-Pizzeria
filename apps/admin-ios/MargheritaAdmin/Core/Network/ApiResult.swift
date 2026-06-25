import Foundation

/// Mirrors Android `ApiResult<T>` + `ApiFailure`.
enum ApiResult<T> {
    case success(T)
    case failure(ApiFailure)

    var value: T? { if case .success(let v) = self { return v } else { return nil } }
    var error: ApiFailure? { if case .failure(let e) = self { return e } else { return nil } }
    var isSuccess: Bool { if case .success = self { return true } else { return false } }

    func map<U>(_ transform: (T) -> U) -> ApiResult<U> {
        switch self {
        case .success(let v): return .success(transform(v))
        case .failure(let e): return .failure(e)
        }
    }
}

enum ApiFailure: Error {
    case network(String)
    case unauthorized
    case forbidden
    case notFound
    case validation(message: String, fields: [String: String])
    case server(status: Int, message: String)
    case decoding(String)
    case unknown(String)

    var displayMessage: String {
        switch self {
        case .network(let m):              return m.isEmpty ? "Network error." : m
        case .unauthorized:                return "You have been signed out."
        case .forbidden:                   return "You don't have access to that."
        case .notFound:                    return "Not found."
        case .validation(let m, let fields):
            let base = m.isEmpty ? "Please check the form and try again." : m
            guard !fields.isEmpty else { return base }
            let details = fields
                .sorted { $0.key < $1.key }
                .map { "\($0.key): \($0.value)" }
                .joined(separator: "\n")
            return "\(base)\n\(details)"
        case .server(_, let m):            return m.isEmpty ? "Server error." : m
        case .decoding(let m):             return "Couldn't read the server response. \(m)"
        case .unknown(let m):              return m.isEmpty ? "Something went wrong." : m
        }
    }
}
