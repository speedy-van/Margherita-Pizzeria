import SwiftUI

struct RootView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var router: RootRouter
    @EnvironmentObject var dialog: DialogController
    @EnvironmentObject var language: LanguageStore

    var body: some View {
        Group {
            switch container.session.state {
            case .unknown:
                SplashView()
            case .signedOut:
                NavigationStack {
                    LoginView(container: container)
                }
            case .signedIn:
                MainTabView(container: container, router: router)
            }
        }
        .onReceive(container.sessionEvents) { event in
            switch event {
            case .signedOutRemotely:
                dialog.alert(
                    title: language.text("Signed out"),
                    message: language.text("Your session expired. Please sign in again."),
                    tone: .warning,
                    okLabel: language.text("OK")
                )
            }
        }
    }
}

private struct SplashView: View {
    @EnvironmentObject var language: LanguageStore

    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            VStack(spacing: AppTheme.Space.lg) {
                Image("BrandLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 96, height: 96)
                    .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous))
                    .accessibilityLabel("Margherita Pizza logo")
                Text(language.text("app.name"))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(AppTheme.onSurface)
                ProgressView().tint(AppTheme.primary)
            }
        }
    }
}
