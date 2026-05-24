import Foundation

/// Mirrors Android `BuildConfig` (`BASE_URL`, `ENABLE_HTTP_LOGGING`).
/// Values are injected via the Xcode build setting `API_BASE_URL` →
/// `Info.plist` (`API_BASE_URL`, `ENABLE_HTTP_LOGGING`).
enum AppConfig {
    static let baseURL: URL = {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let fallback = "http://localhost:3000/"
        let s = (raw?.isEmpty == false ? raw! : fallback)
        // Ensure trailing slash so URL(string:relativeTo:) joins correctly.
        let normalised = s.hasSuffix("/") ? s : s + "/"
        return URL(string: normalised) ?? URL(string: fallback)!
    }()

    static let httpLoggingEnabled: Bool = {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "ENABLE_HTTP_LOGGING") as? String) ?? "NO"
        return raw.uppercased() == "YES" || raw == "1" || raw.lowercased() == "true"
    }()
}
