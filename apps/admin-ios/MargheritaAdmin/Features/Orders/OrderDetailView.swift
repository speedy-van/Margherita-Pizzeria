import SwiftUI

struct OrderDetailView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @StateObject private var vm: OrderDetailViewModel

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
                ScrollView {
                    VStack(alignment: .leading, spacing: AppTheme.Space.lg) {
                        header(d)
                        customerCard(d)
                        itemsCard(d)
                        totalsCard(d)
                        statusControls(d)
                        if let err = vm.lastError {
                            Label(err, systemImage: "exclamationmark.triangle.fill")
                                .foregroundStyle(AppTheme.danger).font(.subheadline)
                        }
                    }
                    .padding(AppTheme.Space.lg)
                }
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(vm.detail?.reference ?? "Order")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await vm.load() }
        .task { await vm.load() }
    }

    @ViewBuilder private func header(_ d: AdminOrderDetail) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Space.sm) {
            HStack {
                Text(d.reference ?? d.id).font(.title3.bold())
                Spacer()
                StatusBadge(label: prettyStatus(d.status), kind: orderStatusKind(d.status))
            }
            Text("\(d.type.capitalized) · \(Format.shortDateTime(d.createdAt))")
                .font(.subheadline).foregroundStyle(AppTheme.onSurfaceMuted)
            if let et = d.estimatedTime {
                Text("ETA: \(et)").font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }

    @ViewBuilder private func customerCard(_ d: AdminOrderDetail) -> some View {
        SectionCard(title: "Customer") {
            kv("Name", d.customerName ?? "—")
            kv("Email", d.customerEmail ?? "—")
            kv("Phone", d.customerPhone ?? "—")
            if d.type == "delivery" { kv("Address", d.address ?? "—") }
            if let m = d.paymentMethod { kv("Payment", m) }
            if let n = d.notes, !n.isEmpty { kv("Notes", n) }
        }
    }

    @ViewBuilder private func itemsCard(_ d: AdminOrderDetail) -> some View {
        SectionCard(title: "Items (\(d.items.count))") {
            VStack(spacing: AppTheme.Space.sm) {
                ForEach(d.items, id: \.identityId) { item in
                    HStack(alignment: .top) {
                        Text("\(item.quantity)×").font(.subheadline.weight(.semibold))
                            .frame(width: 32, alignment: .leading)
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
                    Divider()
                }
            }
        }
    }

    @ViewBuilder private func totalsCard(_ d: AdminOrderDetail) -> some View {
        SectionCard(title: "Totals") {
            kv("Subtotal", Format.pence(d.subtotalPence))
            if d.deliveryFeePence > 0 { kv("Delivery", Format.pence(d.deliveryFeePence)) }
            if d.discountPence > 0 {
                kv("Discount" + (d.discountCode.map { " (\($0))" } ?? ""),
                   "−" + Format.pence(d.discountPence))
            }
            Divider()
            HStack {
                Text("Total").font(.headline)
                Spacer()
                Text(Format.pence(d.totalPence)).font(.headline)
            }
        }
    }

    @ViewBuilder private func statusControls(_ d: AdminOrderDetail) -> some View {
        let next = OrderStatuses.nextOptions(for: d.status, type: d.type)
        if !next.isEmpty {
            SectionCard(title: "Update status") {
                FlowLayout(spacing: AppTheme.Space.sm) {
                    ForEach(next, id: \.self) { s in
                        Button {
                            confirmAndApply(s, current: d.status)
                        } label: {
                            HStack(spacing: 6) {
                                if vm.updatingStatus == s { ProgressView().controlSize(.small) }
                                Text(prettyStatus(s)).font(.subheadline.weight(.semibold))
                            }
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(buttonColour(for: s))
                            .foregroundStyle(.white)
                            .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                        .disabled(vm.updatingStatus != nil)
                    }
                }
            }
        }
    }

    private func buttonColour(for s: String) -> Color {
        switch s {
        case "cancelled", "refunded": return AppTheme.danger
        case "completed", "delivered": return AppTheme.success
        default: return AppTheme.primary
        }
    }

    private func confirmAndApply(_ status: String, current: String) {
        let destructive = ["cancelled", "refunded"].contains(status)
        dialog.confirm(
            title: "Set status to \(prettyStatus(status))?",
            message: "Current status: \(prettyStatus(current))",
            confirmLabel: "Apply",
            destructive: destructive
        ) { ok in
            guard ok else { return }
            Task { await vm.updateStatus(status) }
        }
    }

    @ViewBuilder private func kv(_ k: String, _ v: String) -> some View {
        HStack(alignment: .top) {
            Text(k).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                .frame(width: 90, alignment: .leading)
            Text(v).font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
