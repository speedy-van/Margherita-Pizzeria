import SwiftUI

struct BookingsListView: View {
    @EnvironmentObject var container: AppContainer
    @StateObject private var vm: BookingsListViewModel

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeBookingsListViewModel())
    }

    var body: some View {
        VStack(spacing: 0) {
            filters
            content
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle("Bookings")
        .navigationDestination(for: Route.self) { route in
            if case .bookingDetail(let id) = route {
                BookingDetailView(container: container, id: id)
            }
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    @ViewBuilder private var filters: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppTheme.Space.sm) {
                chip(label: "All",
                     selected: vm.statusFilter == nil) { vm.statusFilter = nil }
                ForEach(BookingStatuses.all, id: \.self) { s in
                    chip(label: prettyStatus(s),
                         selected: vm.statusFilter == s) { vm.statusFilter = s }
                }
            }
            .padding(AppTheme.Space.md)
        }
        .background(AppTheme.background)
    }

    @ViewBuilder private var content: some View {
        if case .loading = vm.phase, vm.items.isEmpty {
            LoadingState()
        } else if case .failed(let m) = vm.phase, vm.items.isEmpty {
            ErrorState(message: m) { Task { await vm.load() } }
        } else if vm.filtered.isEmpty {
            EmptyState(title: "No bookings",
                       message: "Try clearing the filters.",
                       systemImage: "calendar")
        } else {
            List {
                ForEach(vm.filtered) { b in
                    NavigationLink(value: Route.bookingDetail(b.id)) { row(b) }
                        .listRowBackground(AppTheme.surface)
                }
            }
            .listStyle(.plain)
            .background(AppTheme.background)
            .scrollContentBackground(.hidden)
        }
    }

    @ViewBuilder private func row(_ b: AdminBookingListItem) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(b.customerName ?? "Guest").font(.subheadline.weight(.semibold))
                Spacer()
                StatusBadge(label: prettyStatus(b.status), kind: bookingStatusKind(b.status))
            }
            HStack {
                Label("\(b.covers)", systemImage: "person.2.fill")
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                Label("\(b.date) \(b.timeSlot)", systemImage: "calendar")
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                Spacer()
                if let r = b.reference {
                    Text(r).font(.caption2).foregroundStyle(AppTheme.onSurfaceMuted)
                }
            }
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder private func chip(label: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(selected ? AppTheme.primary : AppTheme.surface)
                .foregroundStyle(selected ? Color.white : AppTheme.onSurface)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(selected ? .clear : AppTheme.outline))
        }
        .buttonStyle(.plain)
    }
}
