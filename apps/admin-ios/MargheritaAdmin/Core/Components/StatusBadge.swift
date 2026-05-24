import SwiftUI

enum StatusKind { case neutral, info, warning, success, danger }

extension StatusKind {
    var background: Color {
        switch self {
        case .neutral: return Color.gray.opacity(0.18)
        case .info:    return AppTheme.info.opacity(0.18)
        case .warning: return AppTheme.warning.opacity(0.22)
        case .success: return AppTheme.success.opacity(0.20)
        case .danger:  return AppTheme.danger.opacity(0.20)
        }
    }
    var foreground: Color {
        switch self {
        case .neutral: return AppTheme.charcoal
        case .info:    return AppTheme.info
        case .warning: return AppTheme.warning
        case .success: return AppTheme.success
        case .danger:  return AppTheme.danger
        }
    }
}

struct StatusBadge: View {
    let label: String
    let kind: StatusKind
    var body: some View {
        Text(label.uppercased())
            .font(.caption2.weight(.semibold))
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(kind.background)
            .foregroundStyle(kind.foreground)
            .clipShape(Capsule())
    }
}

/// Mirrors Android `orderStatusKind(status)`.
func orderStatusKind(_ status: String) -> StatusKind {
    switch status.lowercased() {
    case "received", "pending_payment": return .warning
    case "preparing":                   return .info
    case "ready", "out_for_delivery":   return .info
    case "completed", "delivered":      return .success
    case "cancelled", "refunded":       return .danger
    default:                            return .neutral
    }
}

func bookingStatusKind(_ status: String) -> StatusKind {
    switch status.lowercased() {
    case "pending":   return .warning
    case "confirmed": return .success
    case "seated":    return .info
    case "completed": return .success
    case "cancelled", "rejected", "no_show": return .danger
    default:          return .neutral
    }
}

func prettyStatus(_ s: String) -> String {
    s.replacingOccurrences(of: "_", with: " ").capitalized
}
