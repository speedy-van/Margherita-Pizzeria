import Foundation

/// Mirrors `core/ui/format/Format.kt`.
enum Format {
    /// `1499` → "£14.99". Pence are Int as on the backend.
    static func pence(_ p: Int?) -> String {
        guard let p else { return "—" }
        let pounds = Double(p) / 100.0
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "GBP"
        f.locale = Locale(identifier: "en_GB")
        return f.string(from: NSNumber(value: pounds)) ?? String(format: "£%.2f", pounds)
    }

    /// "2026-05-24T17:30:00.000Z" → "24 May, 18:30" (local zone).
    static func shortDateTime(_ iso: String?) -> String {
        guard let iso, let date = parseISO(iso) else { return "—" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB")
        f.dateFormat = "d MMM, HH:mm"
        return f.string(from: date)
    }

    static func date(_ iso: String?) -> String {
        guard let iso, let date = parseISO(iso) else { return "—" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB")
        f.dateFormat = "d MMM yyyy"
        return f.string(from: date)
    }

    static func time(_ iso: String?) -> String {
        guard let iso, let date = parseISO(iso) else { return "—" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB")
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }

    private static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoBasic: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func parseISO(_ s: String) -> Date? {
        if let d = isoFractional.date(from: s) { return d }
        if let d = isoBasic.date(from: s) { return d }
        return nil
    }
}
