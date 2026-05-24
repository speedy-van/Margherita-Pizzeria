import SwiftUI

struct RootView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var router: RootRouter
    @EnvironmentObject var dialog: DialogController

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
                    title: "Signed out",
                    message: "Your session expired. Please sign in again.",
                    tone: .warning
                )
            }
        }
    }
}

private struct SplashView: View {
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            VStack(spacing: AppTheme.Space.lg) {
                Image(systemName: "fork.knife.circle.fill")
                    .resizable().scaledToFit()
                    .frame(width: 80, height: 80)
                    .foregroundStyle(AppTheme.primary)
                Text("Margherita Admin")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(AppTheme.onSurface)
                ProgressView().tint(AppTheme.primary)
            }
        }
    }
}
