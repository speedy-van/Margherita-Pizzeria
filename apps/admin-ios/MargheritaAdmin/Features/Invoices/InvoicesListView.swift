import SwiftUI

struct InvoicesListView: View {
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: InvoicesListViewModel

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeInvoicesListViewModel())
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.items.isEmpty {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.items.isEmpty {
                ErrorState(message: m) { Task { await vm.load() } }
            } else if vm.filtered.isEmpty {
                EmptyState(
                    title: language.text("No invoices"),
                    message: language.text("Orders will appear here once placed.")
                )
            } else {
                List(vm.filtered) { item in
                    NavigationLink(value: Route.invoiceDetail(item.id)) {
                        invoiceRow(item)
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .background(AppTheme.background)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(language.text("Invoices"))
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $vm.search, prompt: language.text("Search ref, name, phone, email"))
        .refreshable { await vm.load() }
        .task { await vm.load() }
    }

    @ViewBuilder private func invoiceRow(_ item: AdminOrderListItem) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("INV-\(item.reference ?? String(item.id.prefix(8)).uppercased())")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text(Format.pence(item.totalPence))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AppTheme.primary)
            }
            HStack {
                Text(item.customerName ?? language.text("Guest"))
                    .font(.caption)
                    .foregroundStyle(AppTheme.onSurfaceMuted)
                Spacer()
                Text(Format.shortDateTime(item.createdAt))
                    .font(.caption2)
                    .foregroundStyle(AppTheme.onSurfaceMuted)
            }
        }
        .padding(.vertical, 2)
    }
}
