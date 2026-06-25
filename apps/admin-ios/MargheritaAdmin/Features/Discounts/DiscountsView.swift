import SwiftUI

struct DiscountsView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: DiscountsViewModel
    @State private var editing: EditTarget?

    struct EditTarget: Identifiable {
        let id = UUID()
        let discount: AdminDiscount?
    }

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeDiscountsViewModel())
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.items.isEmpty {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.items.isEmpty {
                ErrorState(message: m) { Task { await vm.load() } }
            } else if vm.items.isEmpty {
                EmptyState(title: language.text("No discounts"),
                           message: language.text("Tap + to create one."),
                           systemImage: "tag")
            } else {
                List {
                    ForEach(vm.items) { d in
                        row(d)
                            .listRowBackground(AppTheme.surface)
                            .contentShape(Rectangle())
                            .onTapGesture { editing = EditTarget(discount: d) }
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    dialog.confirm(
                                        title: language.isArabic ? "حذف \(d.code)؟" : "Delete \(d.code)?",
                                        message: language.text("This cannot be undone."),
                                        confirmLabel: language.text("Delete"),
                                        cancelLabel: language.text("Cancel"),
                                        destructive: true
                                    ) { ok in
                                        guard ok else { return }
                                        Task { _ = await vm.delete(d) }
                                    }
                                } label: { Label(language.text("Delete"), systemImage: "trash") }
                            }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .background(AppTheme.background)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(language.text("Discounts"))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { editing = EditTarget(discount: nil) } label: { Image(systemName: "plus") }
            }
        }
        .sheet(item: $editing) { target in
            DiscountEditorView(
                target: target.discount,
                working: vm.working,
                errorMessage: vm.lastError,
                onSubmit: { input in
                    Task {
                        let ok = await vm.save(input: input, editingId: target.discount?.id)
                        if ok { editing = nil }
                    }
                },
                onCancel: { editing = nil }
            )
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    @ViewBuilder private func row(_ d: AdminDiscount) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(d.code).font(.subheadline.weight(.semibold))
                    StatusBadge(label: d.active ? language.text("Active") : language.text("Inactive"),
                                kind: d.active ? .success : .neutral)
                }
                Text(d.title).font(.caption)
                Text(valueLabel(d)).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }

    private func valueLabel(_ d: AdminDiscount) -> String {
        let v = d.type == "percentage" ? "\(d.value)%" : Format.pence(d.value)
        return "\(v) · \(language.text("min")) \(Format.pence(d.minOrderPence))"
    }
}

struct DiscountEditorView: View {
    @EnvironmentObject var language: LanguageStore

    let target: AdminDiscount?
    let working: Bool
    let errorMessage: String?
    let onSubmit: (DiscountInput) -> Void
    let onCancel: () -> Void

    @State private var code: String = ""
    @State private var title: String = ""
    @State private var description: String = ""
    @State private var type: String = "percentage"
    @State private var valueText: String = ""
    @State private var minOrderText: String = "0.00"
    @State private var startsAt: String = ""
    @State private var endsAt: String = ""
    @State private var active: Bool = true
    @State private var appliesToDelivery: Bool = true
    @State private var appliesToCollection: Bool = true

    var body: some View {
        NavigationStack {
            Form {
                Section(language.text("Discount")) {
                    TextField(language.text("Code (e.g. WELCOME10)"), text: $code)
                        .autocapitalization(.allCharacters).disableAutocorrection(true)
                    TextField(language.text("Title"), text: $title)
                    TextField(language.text("Description (optional)"), text: $description, axis: .vertical)
                        .lineLimit(2...4)
                    Picker(language.text("Type"), selection: $type) {
                        Text(language.text("Percentage")).tag("percentage")
                        Text(language.text("Fixed (£)")).tag("fixed")
                    }
                    .pickerStyle(.segmented)
                    HStack {
                        Text(type == "percentage" ? language.text("Value (%)") : language.text("Value (£)"))
                        Spacer()
                        TextField("0", text: $valueText)
                            .keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 100)
                    }
                    HStack {
                        Text(language.text("Min order (£)"))
                        Spacer()
                        TextField("0.00", text: $minOrderText)
                            .keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(width: 100)
                    }
                }
                Section(language.text("Validity")) {
                    TextField(language.text("Starts at (ISO, optional)"), text: $startsAt)
                        .autocapitalization(.none).disableAutocorrection(true)
                    TextField(language.text("Ends at (ISO, optional)"), text: $endsAt)
                        .autocapitalization(.none).disableAutocorrection(true)
                    Toggle(language.text("Active"), isOn: $active).tint(AppTheme.primary)
                }
                Section(language.text("Applies to")) {
                    Toggle(language.text("Delivery"), isOn: $appliesToDelivery).tint(AppTheme.primary)
                    Toggle(language.text("Collection"), isOn: $appliesToCollection).tint(AppTheme.primary)
                }
                if let e = errorMessage {
                    Section {
                        Label(e, systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(AppTheme.danger).font(.subheadline)
                    }
                }
            }
            .navigationTitle(target == nil ? language.text("New discount") : language.text("Edit discount"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(language.text("Cancel"), action: onCancel).disabled(working)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(working ? language.text("Saving…") : language.text("Save")) { submit() }
                        .disabled(working || code.isEmpty || title.isEmpty || rawValue == nil)
                }
            }
            .onAppear { hydrate() }
        }
    }

    private var rawValue: Int? {
        let t = valueText.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)
        guard let d = Double(t), d >= 0 else { return nil }
        return type == "percentage" ? Int(d.rounded()) : Int((d * 100).rounded())
    }

    private func submit() {
        guard let v = rawValue else { return }
        let minPence = pence(minOrderText) ?? 0
        onSubmit(DiscountInput(
            code: code.uppercased(),
            title: title,
            description: description.isEmpty ? nil : description,
            type: type,
            value: v,
            minOrderPence: minPence,
            startsAt: startsAt.isEmpty ? nil : startsAt,
            endsAt: endsAt.isEmpty ? nil : endsAt,
            active: active,
            appliesToDelivery: appliesToDelivery,
            appliesToCollection: appliesToCollection
        ))
    }

    private func hydrate() {
        guard let d = target else { return }
        code = d.code; title = d.title; description = d.description ?? ""
        type = d.type
        valueText = d.type == "percentage" ? "\(d.value)" : String(format: "%.2f", Double(d.value) / 100.0)
        minOrderText = String(format: "%.2f", Double(d.minOrderPence) / 100.0)
        startsAt = d.startsAt ?? ""; endsAt = d.endsAt ?? ""
        active = d.active
        appliesToDelivery = d.appliesToDelivery
        appliesToCollection = d.appliesToCollection
    }

    private func pence(_ s: String) -> Int? {
        let t = s.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)
        guard let d = Double(t), d >= 0 else { return nil }
        return Int((d * 100).rounded())
    }
}
