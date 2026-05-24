import SwiftUI

struct OrdersListView: View {
    @EnvironmentObject var container: AppContainer
    @StateObject private var vm: OrdersListViewModel

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeOrdersListViewModel())
    }

    var body: some View {
        VStack(spacing: 0) {
            filters
            content
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle("Orders")
        .navigationDestination(for: Route.self) { route in
            if case .orderDetail(let id) = route {
                OrderDetailView(container: container, id: id)
            }
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    @ViewBuilder private var filters: some View {
        VStack(spacing: AppTheme.Space.sm) {
            HStack {
                Image(systemName: "magnifyingglass").foregroundStyle(AppTheme.onSurfaceMuted)
                TextField("Search ref, name, phone, email", text: $vm.search)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                if !vm.search.isEmpty {
                    Button { vm.search = "" } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                    }
                }
            }
            .padding(10)
            .background(AppTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(AppTheme.outline))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppTheme.Space.sm) {
                    chip(label: "All status",
                         selected: vm.statusFilter == nil) { vm.statusFilter = nil }
                    ForEach(OrderStatuses.all, id: \.self) { s in
                        chip(label: prettyStatus(s),
                             selected: vm.statusFilter == s) { vm.statusFilter = s }
                    }
                }
                .padding(.vertical, 2)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppTheme.Space.sm) {
                    chip(label: "All types",
                         selected: vm.typeFilter == nil) { vm.typeFilter = nil }
                    chip(label: "Delivery",
                         selected: vm.typeFilter == "delivery") { vm.typeFilter = "delivery" }
                    chip(label: "Collection",
                         selected: vm.typeFilter == "collection") { vm.typeFilter = "collection" }
                }
                .padding(.vertical, 2)
            }
        }
        .padding(AppTheme.Space.md)
        .background(AppTheme.background)
    }

    @ViewBuilder private var content: some View {
        if case .loading = vm.phase, vm.items.isEmpty {
            LoadingState()
        } else if case .failed(let m) = vm.phase, vm.items.isEmpty {
            ErrorState(message: m) { Task { await vm.load() } }
        } else if vm.filtered.isEmpty {
            EmptyState(title: "No orders",
                       message: "Try clearing the filters.",
                       systemImage: "bag")
        } else {
            List {
                ForEach(vm.filtered) { o in
                    NavigationLink(value: Route.orderDetail(o.id)) { row(o) }
                        .listRowBackground(AppTheme.surface)
                }
            }
            .listStyle(.plain)
            .background(AppTheme.background)
            .scrollContentBackground(.hidden)
        }
    }

    @ViewBuilder private func row(_ o: AdminOrderListItem) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(o.reference ?? o.id).font(.subheadline.weight(.semibold))
                Spacer()
                Text(Format.pence(o.totalPence)).font(.subheadline.weight(.semibold))
            }
            HStack {
                StatusBadge(label: prettyStatus(o.status), kind: orderStatusKind(o.status))
                StatusBadge(label: o.type.capitalized, kind: .neutral)
                Spacer()
                Text(Format.shortDateTime(o.createdAt))
                    .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
            Text(o.customerName ?? "Guest")
                .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func chip(label: String, selected: Bool, action: @escaping () -> Void) -> some View {
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
