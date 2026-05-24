import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var router: RootRouter
    @StateObject private var vm: DashboardViewModel

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeDashboardViewModel())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppTheme.Space.lg) {
                if case .loading = vm.phase, vm.stats == nil {
                    LoadingState().frame(height: 320)
                } else if case .failed(let msg) = vm.phase, vm.stats == nil {
                    ErrorState(message: msg) { Task { await vm.load() } }
                        .frame(height: 320)
                } else if let s = vm.stats {
                    statGrid(s)
                    SectionCard(title: "Recent orders") {
                        if s.latestOrders.isEmpty {
                            Text("No orders yet.")
                                .foregroundStyle(AppTheme.onSurfaceMuted)
                                .font(.subheadline)
                        } else {
                            VStack(spacing: AppTheme.Space.sm) {
                                ForEach(s.latestOrders.prefix(6)) { o in
                                    Button { router.navigateToOrder(o.id) } label: {
                                        orderRow(o)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    SectionCard(title: "Recent bookings") {
                        if s.latestBookings.isEmpty {
                            Text("No bookings yet.")
                                .foregroundStyle(AppTheme.onSurfaceMuted)
                                .font(.subheadline)
                        } else {
                            VStack(spacing: AppTheme.Space.sm) {
                                ForEach(s.latestBookings.prefix(6)) { b in
                                    Button { router.navigateToBooking(b.id) } label: {
                                        bookingRow(b)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
            }
            .padding(AppTheme.Space.lg)
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle("Dashboard")
        .refreshable { await vm.load() }
        .task { await vm.load() }
    }

    @ViewBuilder private func statGrid(_ s: AdminDashboardStats) -> some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: AppTheme.Space.md),
                            GridItem(.flexible(), spacing: AppTheme.Space.md)],
                  spacing: AppTheme.Space.md) {
            statTile("Total orders", "\(s.totalOrders)", icon: "bag")
            statTile("Order value", Format.pence(s.totalOrderValuePence), icon: "sterlingsign.circle")
            statTile("Pending orders", "\(s.pendingOrders)", icon: "clock", emph: s.pendingOrders > 0)
            statTile("Total bookings", "\(s.totalBookings)", icon: "calendar")
            statTile("Pending bookings", "\(s.pendingBookings)", icon: "calendar.badge.exclamationmark",
                     emph: s.pendingBookings > 0)
            if let rev = s.revenueTodayPence {
                statTile("Today", Format.pence(rev), icon: "chart.line.uptrend.xyaxis")
            }
        }
    }

    @ViewBuilder private func statTile(_ title: String, _ value: String,
                                       icon: String, emph: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Space.sm) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(emph ? AppTheme.danger : AppTheme.primary)
                Spacer()
            }
            Text(value).font(.title2.bold())
            Text(title).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface(padding: AppTheme.Space.md)
    }

    @ViewBuilder private func orderRow(_ o: AdminOrderListItem) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(o.reference ?? o.id).font(.subheadline.weight(.semibold))
                Text("\(o.type.capitalized) · \(o.customerName ?? "Guest")")
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                Text(Format.shortDateTime(o.createdAt))
                    .font(.caption2).foregroundStyle(AppTheme.onSurfaceMuted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(Format.pence(o.totalPence)).font(.subheadline.weight(.semibold))
                StatusBadge(label: prettyStatus(o.status), kind: orderStatusKind(o.status))
            }
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle())
    }

    @ViewBuilder private func bookingRow(_ b: AdminBookingListItem) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(b.customerName ?? "Guest").font(.subheadline.weight(.semibold))
                Text("\(b.covers) covers · \(b.date) \(b.timeSlot)")
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
            Spacer()
            StatusBadge(label: prettyStatus(b.status), kind: bookingStatusKind(b.status))
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle())
    }
}
