import SwiftUI

struct MenuItemEditorView: View {
    @EnvironmentObject var language: LanguageStore

    let target: MenuEditTarget
    let onSubmit: (MenuItemInput) -> Void
    let onCancel: () -> Void
    let working: Bool
    let errorMessage: String?

    @State private var name: String = ""
    @State private var description: String = ""
    @State private var priceText: String = ""
    @State private var imageUrl: String = ""
    @State private var available: Bool = true
    @State private var categoryId: String? = nil
    @State private var allergensText: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section(language.text("Item")) {
                    TextField(language.text("Name"), text: $name)
                    TextField(language.text("Description (optional)"), text: $description, axis: .vertical)
                        .lineLimit(2...4)
                    TextField(language.text("Price (£)"), text: $priceText)
                        .keyboardType(.decimalPad)
                    Toggle(language.text("Available"), isOn: $available)
                }
                Section(language.text("Category")) {
                    Picker(language.text("Category"), selection: Binding(
                        get: { categoryId ?? "" },
                        set: { categoryId = $0.isEmpty ? nil : $0 }
                    )) {
                        Text(language.text("Uncategorised")).tag("")
                        ForEach(target.categories) { c in
                            Text(c.name).tag(c.id)
                        }
                    }
                }
                Section(language.text("Image URL")) {
                    TextField("https://…", text: $imageUrl)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                }
                Section(language.text("Allergens (comma-separated)")) {
                    TextField("gluten, dairy, …", text: $allergensText)
                        .autocapitalization(.none)
                }
                if let err = errorMessage {
                    Section {
                        Label(err, systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(AppTheme.danger).font(.subheadline)
                    }
                }
            }
            .navigationTitle(target.item == nil ? language.text("New item") : language.text("Edit item"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(language.text("Cancel"), action: onCancel).disabled(working)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(working ? language.text("Saving…") : language.text("Save")) {
                        guard let pence = parsePence(priceText), !name.isEmpty else { return }
                        let allergens = allergensText
                            .split(separator: ",")
                            .map { $0.trimmingCharacters(in: .whitespaces) }
                            .filter { !$0.isEmpty }
                        onSubmit(MenuItemInput(
                            name: name.trimmingCharacters(in: .whitespaces),
                            description: description.isEmpty ? nil : description,
                            pricePence: pence,
                            categoryId: categoryId,
                            imageUrl: imageUrl.isEmpty ? nil : imageUrl,
                            available: available,
                            allergens: allergens
                        ))
                    }
                    .disabled(working || name.isEmpty || parsePence(priceText) == nil)
                }
            }
        }
        .onAppear { hydrate() }
    }

    private func hydrate() {
        guard let item = target.item else {
            if categoryId == nil {
                categoryId = target.categories.first?.id
            }
            return
        }
        name = item.name
        description = item.description ?? ""
        priceText = String(format: "%.2f", Double(item.pricePence) / 100.0)
        imageUrl = item.imageUrl ?? ""
        available = item.available
        categoryId = item.categoryId
        allergensText = (item.allergens ?? []).joined(separator: ", ")
    }

    private func parsePence(_ s: String) -> Int? {
        let trimmed = s.replacingOccurrences(of: ",", with: ".")
            .trimmingCharacters(in: .whitespaces)
        guard let d = Double(trimmed), d >= 0 else { return nil }
        return Int((d * 100).rounded())
    }
}
