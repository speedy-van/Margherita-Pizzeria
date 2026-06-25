import Foundation

/// Mirrors Android `BuildConfig` (`BASE_URL`).
/// Values are injected via the Xcode build setting `API_BASE_URL` →
/// `Info.plist` (`API_BASE_URL`).
enum AppConfig {
    static let baseURL: URL = {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let fallback = "https://www.margheritapizza.uk/"
        let s = (raw?.isEmpty == false ? raw! : fallback)
        // Ensure trailing slash so URL(string:relativeTo:) joins correctly.
        let normalised = s.hasSuffix("/") ? s : s + "/"
        return URL(string: normalised) ?? URL(string: fallback)!
    }()

}
