import Foundation

/// Tiny URLSession wrapper. Mirrors Android `ApiClient` + `apiCall {}`.
/// - Injects `Authorization: Bearer <token>` from `SessionManager`.
/// - Decodes `ApiEnvelope<T>` and maps to `ApiResult<T>`.
/// - Treats 401 globally by invoking `SessionManager.handleUnauthorized()`.
final class ApiClient {
    private let baseURL: URL
    private let session: URLSession
    private let sessionManager: SessionManager
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let log: Bool

    init(baseURL: URL, sessionManager: SessionManager, log: Bool = AppConfig.httpLoggingEnabled) {
        self.baseURL = baseURL
        self.sessionManager = sessionManager
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 30
        cfg.timeoutIntervalForResource = 60
        cfg.waitsForConnectivity = true
        self.session = URLSession(configuration: cfg)

        let dec = JSONDecoder()
        // Backend returns camelCase already; keep default. Be lenient on dates.
        self.decoder = dec

        let enc = JSONEncoder()
        enc.outputFormatting = []
        self.encoder = enc

        self.log = log
    }

    // MARK: - Public verbs

    func get<T: Decodable>(_ path: String, query: [String: String?] = [:]) async -> ApiResult<T> {
        await call(path: path, method: "GET", query: query, body: Empty?.none)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B?) async -> ApiResult<T> {
        await call(path: path, method: "POST", query: [:], body: body)
    }

    func put<B: Encodable, T: Decodable>(_ path: String, body: B?) async -> ApiResult<T> {
        await call(path: path, method: "PUT", query: [:], body: body)
    }

    func patch<B: Encodable, T: Decodable>(_ path: String, body: B?) async -> ApiResult<T> {
        await call(path: path, method: "PATCH", query: [:], body: body)
    }

    func delete<T: Decodable>(_ path: String) async -> ApiResult<T> {
        await call(path: path, method: "DELETE", query: [:], body: Empty?.none)
    }

    // MARK: - Core

    private struct Empty: Codable {}

    private func call<B: Encodable, T: Decodable>(
        path: String,
        method: String,
        query: [String: String?],
        body: B?
    ) async -> ApiResult<T> {
        // Build URL
        let cleanPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard var components = URLComponents(url: baseURL.appendingPathComponent(cleanPath),
                                             resolvingAgainstBaseURL: false) else {
            return .failure(.unknown("Bad URL: \(path)"))
        }
        let items = query.compactMap { (k, v) -> URLQueryItem? in
            guard let v else { return nil }
            return URLQueryItem(name: k, value: v)
        }
        if !items.isEmpty { components.queryItems = items }
        guard let url = components.url else {
            return .failure(.unknown("Bad URL: \(path)"))
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("MargheritaAdmin-iOS/0.1.1", forHTTPHeaderField: "User-Agent")

        if let token = sessionManager.currentToken, !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            do {
                req.httpBody = try encoder.encode(body)
                req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            } catch {
                return .failure(.unknown("Encode body: \(error.localizedDescription)"))
            }
        }

        if log {
            print("[API] → \(method) \(url.absoluteString)")
        }

        let data: Data, response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch let err as URLError {
            return .failure(.network(err.localizedDescription))
        } catch {
            return .failure(.network(error.localizedDescription))
        }

        guard let http = response as? HTTPURLResponse else {
            return .failure(.unknown("No HTTP response."))
        }

        if log {
            print("[API] ← \(http.statusCode) \(method) \(url.lastPathComponent) (\(data.count) bytes)")
        }

        // Global 401 handling.
        if http.statusCode == 401 {
            await MainActor.run { sessionManager.handleUnauthorized() }
            return .failure(.unauthorized)
        }
        if http.statusCode == 403 { return .failure(.forbidden) }
        if http.statusCode == 404 { return .failure(.notFound) }

        // Try to decode envelope.
        if data.isEmpty {
            if T.self == EmptyResponse.self {
                return .success(EmptyResponse() as! T)
            }
            return .failure(.decoding("Empty response."))
        }

        do {
            let env = try decoder.decode(ApiEnvelope<T>.self, from: data)
            if env.ok, let value = env.data {
                return .success(value)
            }
            if env.ok, T.self == EmptyResponse.self {
                return .success(EmptyResponse() as! T)
            }
            let msg = env.error?.message ?? "Request failed."
            let fields = env.error?.fields ?? [:]
            if (400..<500).contains(http.statusCode) {
                return .failure(.validation(message: msg, fields: fields))
            }
            return .failure(.server(status: http.statusCode, message: msg))
        } catch {
            // Some endpoints return bare bodies; try direct decode.
            if let direct = try? decoder.decode(T.self, from: data) {
                return .success(direct)
            }
            let preview = String(data: data.prefix(200), encoding: .utf8) ?? ""
            return .failure(.decoding("\(error.localizedDescription) — \(preview)"))
        }
    }
}

/// Marker type for endpoints with no useful body (e.g. logout).
struct EmptyResponse: Codable {}
