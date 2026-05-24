import SwiftUI

// Mirrors `core/ui/components/States.kt`.

struct LoadingState: View {
    var label: String = "Loading…"
    var body: some View {
        VStack(spacing: AppTheme.Space.md) {
            ProgressView()
            Text(label)
                .font(.subheadline)
                .foregroundStyle(AppTheme.onSurfaceMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(AppTheme.Space.xl)
    }
}

struct EmptyState: View {
    var title: String
    var message: String?
    var systemImage: String = "tray"
    var body: some View {
        VStack(spacing: AppTheme.Space.md) {
            Image(systemName: systemImage)
                .font(.system(size: 40, weight: .regular))
                .foregroundStyle(AppTheme.onSurfaceMuted)
            Text(title).font(.headline)
            if let message {
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(AppTheme.onSurfaceMuted)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(AppTheme.Space.xl)
    }
}

struct ErrorState: View {
    var message: String
    var onRetry: (() -> Void)?
    var body: some View {
        VStack(spacing: AppTheme.Space.md) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundStyle(AppTheme.danger)
            Text("Something went wrong").font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(AppTheme.onSurfaceMuted)
                .multilineTextAlignment(.center)
            if let onRetry {
                Button("Try again", action: onRetry)
                    .buttonStyle(.borderedProminent)
                    .tint(AppTheme.primary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(AppTheme.Space.xl)
    }
}

struct SectionCard<Content: View>: View {
    let title: String
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Space.md) {
            Text(title).font(.headline)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }
}
