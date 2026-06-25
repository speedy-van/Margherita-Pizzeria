import SwiftUI

struct ImagesView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: ImagesViewModel
    @State private var editing: AdminImage?
    @State private var editURL: String = ""

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeImagesViewModel())
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.items.isEmpty {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.items.isEmpty {
                ErrorState(message: m) { Task { await vm.load() } }
            } else if vm.items.isEmpty {
                EmptyState(title: language.text("No images registered"),
                           message: language.text("Image slots are seeded server-side."),
                           systemImage: "photo")
            } else {
                List {
                    ForEach(vm.items) { img in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(img.label).font(.subheadline.weight(.semibold))
                                    if let s = img.section {
                                        Text(s).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                                    }
                                }
                                Spacer()
                                Button(language.text("Edit")) {
                                    editing = img
                                    editURL = img.url ?? ""
                                }
                                .buttonStyle(.bordered)
                            }
                            if let u = img.url, !u.isEmpty {
                                Text(u).font(.caption2)
                                    .foregroundStyle(AppTheme.onSurfaceMuted)
                                    .lineLimit(1)
                                    .truncationMode(.middle)
                            } else {
                                Text(language.text("(no URL set)")).font(.caption2).foregroundStyle(AppTheme.danger)
                            }
                        }
                        .padding(.vertical, 4)
                        .listRowBackground(AppTheme.surface)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .background(AppTheme.background)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(language.text("Images"))
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .sheet(item: $editing) { img in
            NavigationStack {
                Form {
                    Section(img.label) {
                        TextField("https://…", text: $editURL)
                            .keyboardType(.URL).autocapitalization(.none).disableAutocorrection(true)
                    }
                    if let e = vm.lastError {
                        Section {
                            Label(e, systemImage: "exclamationmark.triangle.fill")
                                .foregroundStyle(AppTheme.danger).font(.subheadline)
                        }
                    }
                }
                .navigationTitle(language.text("Image URL"))
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(language.text("Cancel")) { editing = nil }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(vm.working ? language.text("Saving…") : language.text("Save")) {
                            Task {
                                let ok = await vm.updateURL(id: img.id, url: editURL)
                                if ok { editing = nil }
                            }
                        }
                        .disabled(vm.working)
                    }
                }
            }
        }
    }
}
