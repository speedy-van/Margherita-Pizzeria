import SwiftUI

struct OrderDetailView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: OrderDetailViewModel
    @Environment(\.openURL) private var openURL

    init(container: AppContainer, id: String) {
        _vm = StateObject(wrappedValue: container.makeOrderDetailViewModel(id: id))
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.detail == nil {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.detail == nil {
                ErrorState(message: m) { Task { await vm.load() } }
            } else if let d = vm.detail {
                scrollContent(d)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(vm.detail?.reference ?? language.text("Order"))
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await vm.load() }
        .task { await vm.load() }
    }

    // MARK: - Scroll content

    @ViewBuilder private func scrollContent(_ d: AdminOrderDetail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppTheme.Space.lg) {
                header(d)
                statusControls(d)
                customerCard(d)
                itemsCard(d)
                totalsCard(d)
                if let err = vm.lastError {
                    Label(err, systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(AppTheme.danger)
                        .font(.subheadline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(AppTheme.Space.lg)
            // Extra space so the last card clears the tab bar on all devices
            .padding(.bottom, AppTheme.Space.xxl)
        }
    }

    // MARK: - Header

    @ViewBuilder private func header(_ d: AdminOrderDetail) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Space.sm) {
            HStack {
                Text(d.reference ?? d.id).font(.title3.bold())
                Spacer()
                StatusBadge(label: language.status(d.status), kind: orderStatusKind(d.status))
            }
            Text("\(language.orderType(d.type)) · \(Format.shortDateTime(d.createdAt))")
                .font(.subheadline).foregroundStyle(AppTheme.onSurfaceMuted)
            if let et = d.estimatedTime {
                Text("\(language.text("ETA")): \(et)")
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }

    // MARK: - Status controls

    @ViewBuilder private func statusControls(_ d: AdminOrderDetail) -> some View {
        let next = OrderStatuses.nextOptions(for: d.status, type: d.type)
        let constructive = next.filter { !["cancelled", "rejected"].contains($0) }
        let destructive  = next.filter {  ["cancelled", "rejected"].contains($0) }

        if !next.isEmpty {
            VStack(spacing: AppTheme.Space.sm) {
                ForEach(constructive, id: \.self) { s in
                    statusButton(s)
                }
                if !destructive.isEmpty {
                    if !constructive.isEmpty {
                        Divider()
                    }
                    // Destructive actions sit side-by-side so they don't dominate the layout
                    HStack(spacing: AppTheme.Space.sm) {
                        ForEach(destructive, id: \.self) { s in
                            statusButton(s)
                        }
                    }
                }
            }
            .padding(AppTheme.Space.md)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous)
                    .stroke(Color(.systemGray5), lineWidth: 1)
            )
        }
    }

    @ViewBuilder private func statusButton(_ s: String) -> some View {
        let isDestructive = ["cancelled", "rejected"].contains(s)
        let color: Color = isDestructive ? AppTheme.danger
                        : (s == "delivered" ? AppTheme.success : AppTheme.primary)

        Button {
            confirmAndApply(s, current: vm.detail?.status ?? "")
        } label: {
            HStack(spacing: AppTheme.Space.sm) {
                if vm.updatingStatus == s {
                    ProgressView().controlSize(.small).tint(.white)
                }
                Text(statusButtonLabel(s))
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if vm.updatingStatus != s {
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                }
            }
            .frame(maxWidth: .infinity, minHeight: 44)
            .padding(.horizontal, AppTheme.Space.md)
            .background(color.opacity(vm.updatingStatus != nil && vm.updatingStatus != s ? 0.5 : 1))
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(vm.updatingStatus != nil)
    }

    private func statusButtonLabel(_ s: String) -> String {
        switch s {
        case "cancelled": return language.text("Cancel order")
        case "rejected":  return language.text("Reject order")
        default:          return language.status(s)
        }
    }

    // MARK: - Customer card

    @ViewBuilder private func customerCard(_ d: AdminOrderDetail) -> some View {
        SectionCard(title: language.text("Customer")) {
            VStack(alignment: .leading, spacing: AppTheme.Space.md) {
                Text(d.customerName ?? "—").font(.headline)

                Divider()

                // Phone/email/address always rendered LTR regardless of app language
                VStack(alignment: .leading, spacing: AppTheme.Space.sm) {
                    if let phone = d.customerPhone {
                        infoRow(icon: "phone.fill", text: phone)
                    }
                    if let email = d.customerEmail {
                        infoRow(icon: "envelope.fill", text: email)
                    }
                    if d.type == "delivery", let address = d.address {
                        infoRow(icon: "mappin.circle.fill", text: address)
                    }
                    if let m = d.paymentMethod {
                        infoRow(icon: "creditcard.fill", text: m)
                    }
                    if let n = d.notes, !n.isEmpty {
                        infoRow(icon: "note.text", text: n)
                    }
                }
                .environment(\.layoutDirection, .leftToRight)

                let hasContact = d.customerPhone != nil || d.customerEmail != nil
                    || (d.type == "delivery" && d.address != nil)
                if hasContact {
                    Divider()
                    quickActions(
                        phone: d.customerPhone,
                        email: d.customerEmail,
                        address: d.type == "delivery" ? d.address : nil
                    )
                }
            }
        }
    }

    @ViewBuilder private func infoRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: AppTheme.Space.sm) {
            Image(systemName: icon)
                .frame(width: 20, alignment: .center)
                .foregroundStyle(AppTheme.onSurfaceMuted)
                .font(.subheadline)
            Text(text)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
                // Allow text to wrap naturally — prevents horizontal overflow
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder private func quickActions(phone: String?, email: String?, address: String?) -> some View {
        let emailURL = email.flatMap { URL(string: "mailto:\($0)") }
        let smsURL   = phone.flatMap { URL(string: "sms:\($0)") }
        let callURL  = phone.flatMap { URL(string: "tel:\($0)") }
        let mapURL: URL? = address.flatMap {
            let q = $0.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0
            return URL(string: "maps://?q=\(q)")
        }

        let actions: [(label: String, icon: String, url: URL?)] = [
            (language.text("Email"), "envelope",   emailURL),
            (language.text("SMS"),   "message",    smsURL),
            (language.text("Call"),  "phone",       callURL),
            (language.text("Map"),   "map",         mapURL),
        ]

        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: AppTheme.Space.sm
        ) {
            ForEach(actions, id: \.label) { action in
                Button {
                    if let u = action.url { openURL(u) }
                } label: {
                    HStack(spacing: AppTheme.Space.xs) {
                        Image(systemName: action.icon).font(.subheadline)
                        Text(action.label).font(.subheadline.weight(.medium))
                    }
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(action.url == nil ? Color(.systemGray5) : Color(.systemGray6))
                    .foregroundStyle(action.url == nil ? AppTheme.onSurfaceMuted : AppTheme.onSurface)
                    .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.sm, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(action.url == nil)
            }
        }
    }

    // MARK: - Items card

    @ViewBuilder private func itemsCard(_ d: AdminOrderDetail) -> some View {
        SectionCard(title: "\(language.text("items")) (\(d.items.count))") {
            VStack(spacing: AppTheme.Space.sm) {
                ForEach(Array(d.items.enumerated()), id: \.offset) { idx, item in
                    HStack(alignment: .top, spacing: AppTheme.Space.sm) {
                        Text("\(item.quantity)×")
                            .font(.subheadline.weight(.semibold))
                            .frame(width: 28, alignment: .leading)
                            .foregroundStyle(AppTheme.onSurfaceMuted)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name).font(.subheadline)
                            if let n = item.notes, !n.isEmpty {
                                Text(n).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                            }
                        }
                        Spacer()
                        Text(Format.pence(item.pricePence * item.quantity))
                            .font(.subheadline.weight(.semibold))
                    }
                    if idx < d.items.count - 1 {
                        Divider()
                    }
                }
            }
        }
    }

    // MARK: - Totals card

    @ViewBuilder private func totalsCard(_ d: AdminOrderDetail) -> some View {
        SectionCard(title: language.text("Totals")) {
            VStack(spacing: AppTheme.Space.sm) {
                amountRow(language.text("Subtotal"), Format.pence(d.subtotalPence))
                if d.deliveryFeePence > 0 {
                    amountRow(language.text("Delivery"), Format.pence(d.deliveryFeePence))
                }
                if d.discountPence > 0 {
                    let label = language.text("Discount")
                        + (d.discountCode.map { " (\($0))" } ?? "")
                    amountRow(label, "−" + Format.pence(d.discountPence))
                }
                Divider()
                HStack {
                    Text(language.text("Total")).font(.headline)
                    Spacer()
                    Text(Format.pence(d.totalPence)).font(.headline)
                }
            }
        }
    }

    @ViewBuilder private func amountRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.subheadline).foregroundStyle(AppTheme.onSurfaceMuted)
            Spacer()
            Text(value).font(.subheadline)
        }
    }

    // MARK: - Confirm helper

    private func confirmAndApply(_ status: String, current: String) {
        let destructive = ["cancelled", "rejected"].contains(status)
        dialog.confirm(
            title: "\(language.text("Update status")): \(language.status(status))?",
            message: "\(language.text("Current status")): \(language.status(current))",
            confirmLabel: language.text("Apply"),
            cancelLabel: language.text("Cancel"),
            destructive: destructive
        ) { ok in
            guard ok else { return }
            Task { await vm.updateStatus(status) }
        }
    }
}
