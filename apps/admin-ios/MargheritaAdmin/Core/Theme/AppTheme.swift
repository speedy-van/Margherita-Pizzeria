import SwiftUI

/// Material3-style palette mirroring `core/ui/theme/Theme.kt`.
enum AppTheme {
    // Brand
    static let crimson700 = Color(red: 0.478, green: 0.122, blue: 0.122) // #7A1F1F
    static let crimson500 = Color(red: 0.659, green: 0.169, blue: 0.169) // #A82B2B
    static let amber700   = Color(red: 0.745, green: 0.541, blue: 0.184) // #BE8A2F
    static let amber500   = Color(red: 0.910, green: 0.671, blue: 0.224) // #E8AB39
    static let charcoal   = Color(red: 0.118, green: 0.118, blue: 0.118) // #1E1E1E
    static let offWhite   = Color(red: 0.949, green: 0.922, blue: 0.871) // #F2EBDE
    static let errorRed   = Color(red: 0.749, green: 0.149, blue: 0.149) // #BF2626

    // Semantic
    static let primary           = crimson700
    static let onPrimary         = Color.white
    static let secondary         = amber700
    static let onSecondary       = Color.white
    static let background        = offWhite
    static let surface           = Color.white
    static let surfaceVariant    = offWhite
    static let onSurface         = charcoal
    static let onSurfaceMuted    = charcoal.opacity(0.65)
    static let outline           = Color.black.opacity(0.12)
    static let danger            = errorRed
    static let success           = Color(red: 0.20, green: 0.55, blue: 0.30)
    static let warning           = Color(red: 0.85, green: 0.55, blue: 0.10)
    static let info              = Color(red: 0.20, green: 0.40, blue: 0.70)

    // Spacing scale
    enum Space {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
    }

    enum Radius {
        static let sm: CGFloat = 6
        static let md: CGFloat = 10
        static let lg: CGFloat = 16
    }
}

extension View {
    /// Card surface: white background, subtle outline, rounded.
    func cardSurface(padding: CGFloat = AppTheme.Space.lg) -> some View {
        self
            .padding(padding)
            .background(AppTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous)
                    .stroke(AppTheme.outline, lineWidth: 1)
            )
    }
}
