import SwiftUI

struct MoreView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @EnvironmentObject var language: LanguageStore

    var body: some View {
        List {
            Section(language.text("Manage")) {
                NavigationLink(value: Route.settings) {
                    Label(language.text("Settings"), systemImage: "gearshape.fill")
                }
                NavigationLink(value: Route.images) {
                    Label(language.text("Images"), systemImage: "photo")
                }
                NavigationLink(value: Route.discounts) {
                    Label(language.text("Discounts"), systemImage: "tag.fill")
                }
                NavigationLink(value: Route.invoicesList) {
                    Label(language.text("Invoices"), systemImage: "doc.text.fill")
                }
            }
            Section(language.text("language")) {
                Toggle(isOn: Binding(
                    get: { language.isArabic },
                    set: { language.setArabic($0) }
                )) {
                    Label(language.text("language.toggle"), systemImage: "globe")
                }
                .tint(AppTheme.primary)
                Text(language.text("language.helper"))
                    .font(.caption)
                    .foregroundStyle(AppTheme.onSurfaceMuted)
            }
            Section(language.text("Legal & support")) {
                Link(destination: URL(string: "https://www.margheritapizza.uk/privacy")!) {
                    Label(language.text("Privacy Policy"), systemImage: "lock.shield.fill")
                }
                Link(destination: URL(string: "https://www.margheritapizza.uk/contact")!) {
                    Label(language.text("Support"), systemImage: "questionmark.circle.fill")
                }
            }
            Section(language.text("Account")) {
                if case .signedIn(let user) = container.session.state {
                    HStack {
                        Image(systemName: "person.crop.circle.fill")
                            .foregroundStyle(AppTheme.primary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.email).font(.subheadline)
                            Text(language.role(user.role)).font(.caption)
                                .foregroundStyle(AppTheme.onSurfaceMuted)
                        }
                    }
                }
                Button(role: .destructive) {
                    dialog.confirm(
                        title: language.text("Sign out?"),
                        message: language.text("You'll need to enter your email and password again."),
                        confirmLabel: language.text("Sign out"),
                        cancelLabel: language.text("Cancel"),
                        destructive: true
                    ) { ok in
                        guard ok else { return }
                        Task { await container.signOut() }
                    }
                } label: {
                    Label(language.text("Sign out"), systemImage: "rectangle.portrait.and.arrow.right")
                }
            }
            Section {
                HStack {
                    Text(language.text("Server")).foregroundStyle(.secondary)
                    Spacer()
                    Text(container.baseURL.absoluteString)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1).truncationMode(.middle)
                }
                HStack {
                    Text(language.text("Build")).foregroundStyle(.secondary)
                    Spacer()
                    Text(buildLabel).font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(AppTheme.background)
        .navigationTitle(language.text("More"))
        .navigationDestination(for: Route.self) { route in
            switch route {
            case .settings:              SettingsView(container: container)
            case .images:                ImagesView(container: container)
            case .discounts:             DiscountsView(container: container)
            case .invoicesList:          InvoicesListView(container: container)
            case .invoiceDetail(let id): InvoiceDetailView(container: container, orderId: id)
            default:                     EmptyView()
            }
        }
    }

    private var buildLabel: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
        return "\(v) (\(b))"
    }
}
