import SwiftUI

struct BookingDetailView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @StateObject private var vm: BookingDetailViewModel

    init(container: AppContainer, id: String) {
        _vm = StateObject(wrappedValue: container.makeBookingDetailViewModel(id: id))
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
                        customer(d)
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
        .navigationTitle(vm.detail?.reference ?? "Booking")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await vm.load() }
        .task { await vm.load() }
    }

    @ViewBuilder private func header(_ d: AdminBookingDetail) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Space.sm) {
            HStack {
                Text(d.reference ?? d.id).font(.title3.bold())
                Spacer()
                StatusBadge(label: prettyStatus(d.status), kind: bookingStatusKind(d.status))
            }
            Text("\(d.date) at \(d.timeSlot) · \(d.covers) covers")
                .font(.subheadline).foregroundStyle(AppTheme.onSurfaceMuted)
            if let dp = d.depositPence, dp > 0 {
                Text("Deposit: \(Format.pence(dp)) \(d.depositPaid == true ? "(paid)" : "(unpaid)")")
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }

    @ViewBuilder private func customer(_ d: AdminBookingDetail) -> some View {
        SectionCard(title: "Customer") {
            kv("Name", d.customerName ?? "—")
            kv("Email", d.customerEmail ?? "—")
            kv("Phone", d.customerPhone ?? "—")
            if let t = d.tableId { kv("Table", t) }
            if let n = d.notes, !n.isEmpty { kv("Notes", n) }
        }
    }

    @ViewBuilder private func statusControls(_ d: AdminBookingDetail) -> some View {
        let next = BookingStatuses.nextOptions(for: d.status)
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

    private func confirmAndApply(_ status: String, current: String) {
        let destructive = ["cancelled", "rejected", "no_show"].contains(status)
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

    private func buttonColour(for s: String) -> Color {
        switch s {
        case "cancelled", "rejected", "no_show": return AppTheme.danger
        case "completed", "confirmed":           return AppTheme.success
        default:                                  return AppTheme.primary
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
