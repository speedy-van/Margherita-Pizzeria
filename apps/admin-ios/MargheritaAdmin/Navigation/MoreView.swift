import SwiftUI

struct MoreView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController

    var body: some View {
        List {
            Section("Manage") {
                NavigationLink(value: Route.settings) {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                NavigationLink(value: Route.images) {
                    Label("Images", systemImage: "photo")
                }
                NavigationLink(value: Route.discounts) {
                    Label("Discounts", systemImage: "tag.fill")
                }
            }
            Section("Account") {
                if case .signedIn(let user) = container.session.state {
                    HStack {
                        Image(systemName: "person.crop.circle.fill")
                            .foregroundStyle(AppTheme.primary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.email).font(.subheadline)
                            Text(user.role.capitalized).font(.caption)
                                .foregroundStyle(AppTheme.onSurfaceMuted)
                        }
                    }
                }
                Button(role: .destructive) {
                    dialog.confirm(
                        title: "Sign out?",
                        message: "You'll need to enter your email and password again.",
                        confirmLabel: "Sign out",
                        destructive: true
                    ) { ok in
                        guard ok else { return }
                        Task { await container.auth.signOut() }
                    }
                } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                }
            }
            Section {
                HStack {
                    Text("Server").foregroundStyle(.secondary)
                    Spacer()
                    Text(container.baseURL.absoluteString)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1).truncationMode(.middle)
                }
                HStack {
                    Text("Build").foregroundStyle(.secondary)
                    Spacer()
                    Text(buildLabel).font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(AppTheme.background)
        .navigationTitle("More")
        .navigationDestination(for: Route.self) { route in
            switch route {
            case .settings:  SettingsView(container: container)
            case .images:    ImagesView(container: container)
            case .discounts: DiscountsView(container: container)
            default:         EmptyView()
            }
        }
    }

    private var buildLabel: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
        return "\(v) (\(b))"
    }
}
