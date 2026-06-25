import SwiftUI

struct OrdersListView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var language: LanguageStore
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
        .navigationTitle(language.text("Orders"))
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
                TextField(language.text("Search ref, name, phone, email"), text: $vm.search)
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
                    chip(label: language.text("All status"),
                         selected: vm.statusFilter == nil) { vm.statusFilter = nil }
                    ForEach(OrderStatuses.all, id: \.self) { s in
                        chip(label: language.status(s),
                             selected: vm.statusFilter == s) { vm.statusFilter = s }
                    }
                }
                .padding(.vertical, 2)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppTheme.Space.sm) {
                    chip(label: language.text("All types"),
                         selected: vm.typeFilter == nil) { vm.typeFilter = nil }
                    chip(label: language.text("Delivery"),
                         selected: vm.typeFilter == "delivery") { vm.typeFilter = "delivery" }
                    chip(label: language.text("Collection"),
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
            EmptyState(title: language.text("No orders"),
                       message: language.text("Try clearing the filters."),
                       systemImage: "bag")
        } else {
            List {
                Section {
                    Text("\(vm.filtered.count) \(vm.filtered.count == 1 ? language.text("order") : language.text("orders"))")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AppTheme.onSurfaceMuted)
                        .textCase(nil)
                        .listRowBackground(AppTheme.background)
                }
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
        HStack(alignment: .top, spacing: AppTheme.Space.md) {
            RoundedRectangle(cornerRadius: 2)
                .fill(orderStatusKind(o.status).foreground)
                .frame(width: 4)
                .padding(.vertical, 4)

            VStack(alignment: .leading, spacing: AppTheme.Space.sm) {
                HStack(alignment: .firstTextBaseline, spacing: AppTheme.Space.sm) {
                    Text(o.reference ?? o.id)
                        .font(.headline.weight(.semibold))
                        .lineLimit(1)
                    Spacer(minLength: AppTheme.Space.sm)
                    Text(Format.pence(o.totalPence))
                        .font(.headline.weight(.bold))
                        .monospacedDigit()
                }
                HStack(spacing: AppTheme.Space.sm) {
                    StatusBadge(label: language.status(o.status), kind: orderStatusKind(o.status))
                    StatusBadge(label: language.orderType(o.type), kind: .neutral)
                    if let count = o.itemCount {
                        Text("\(count) \(count == 1 ? language.text("item") : language.text("items"))")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(AppTheme.onSurfaceMuted)
                    }
                    Spacer(minLength: 0)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(o.customerName ?? language.text("Guest"))
                        .font(.subheadline)
                        .lineLimit(1)
                    if let phone = o.customerPhone, !phone.isEmpty {
                        Text(phone)
                            .font(.caption)
                            .foregroundStyle(AppTheme.onSurfaceMuted)
                            .lineLimit(1)
                    }
                }
                Text(Format.shortDateTime(o.createdAt))
                    .font(.caption2)
                    .foregroundStyle(AppTheme.onSurfaceMuted)
            }
        }
        .padding(.vertical, 10)
        .contentShape(Rectangle())
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
