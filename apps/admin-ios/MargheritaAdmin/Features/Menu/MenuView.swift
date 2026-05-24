import SwiftUI

struct MenuView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @StateObject private var vm: MenuViewModel
    @State private var editing: MenuEditTarget?

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeMenuViewModel())
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.items.isEmpty {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.items.isEmpty {
                ErrorState(message: m) { Task { await vm.load() } }
            } else if vm.categories.isEmpty && vm.items.isEmpty {
                EmptyState(title: "No menu items yet",
                           message: "Tap + to add the first one.",
                           systemImage: "list.bullet")
            } else {
                List {
                    ForEach(vm.categories) { cat in
                        Section(header: Text(cat.name).font(.headline)) {
                            let rows = vm.itemsFor(category: cat)
                            if rows.isEmpty {
                                Text("No items in this category.")
                                    .font(.subheadline).foregroundStyle(AppTheme.onSurfaceMuted)
                                    .listRowBackground(AppTheme.surface)
                            }
                            ForEach(rows) { item in
                                row(item)
                                    .listRowBackground(AppTheme.surface)
                            }
                        }
                    }
                    if !vm.uncategorised.isEmpty {
                        Section(header: Text("Uncategorised").font(.headline)) {
                            ForEach(vm.uncategorised) { item in
                                row(item)
                                    .listRowBackground(AppTheme.surface)
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .background(AppTheme.background)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle("Menu")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    editing = MenuEditTarget(item: nil,
                                             categories: vm.categories)
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(item: $editing) { target in
            MenuItemEditorView(
                target: target,
                onSubmit: { input in
                    Task {
                        let ok = await vm.save(input: input, editingId: target.item?.id)
                        if ok { editing = nil }
                    }
                },
                onCancel: { editing = nil },
                working: vm.working,
                errorMessage: vm.lastError
            )
            .environmentObject(vm)
        }
        .refreshable { await vm.load() }
        .task { await vm.load() }
    }

    @ViewBuilder private func row(_ item: AdminMenuItem) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name).font(.subheadline.weight(.semibold))
                if let d = item.description, !d.isEmpty {
                    Text(d).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                        .lineLimit(2)
                }
                Text(Format.pence(item.pricePence)).font(.caption.weight(.semibold))
            }
            Spacer()
            Toggle("", isOn: Binding(
                get: { item.available },
                set: { _ in Task { await vm.toggleAvailability(item) } }
            ))
            .labelsHidden()
            .tint(AppTheme.primary)
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle())
        .onTapGesture {
            editing = MenuEditTarget(item: item, categories: vm.categories)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                dialog.confirm(
                    title: "Delete \(item.name)?",
                    message: "This cannot be undone.",
                    confirmLabel: "Delete",
                    destructive: true
                ) { ok in
                    guard ok else { return }
                    Task { _ = await vm.delete(item) }
                }
            } label: { Label("Delete", systemImage: "trash") }
        }
    }
}

struct MenuEditTarget: Identifiable {
    let id = UUID()
    let item: AdminMenuItem?
    let categories: [AdminMenuCategory]
}
