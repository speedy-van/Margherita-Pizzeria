import Foundation

@MainActor
final class MenuViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var categories: [AdminMenuCategory] = []
    @Published var items: [AdminMenuItem] = []
    @Published var phase: Phase = .idle
    @Published var lastError: String?
    @Published var working: Bool = false

    private let repo: MenuRepository
    init(repo: MenuRepository) { self.repo = repo }

    func itemsFor(category: AdminMenuCategory) -> [AdminMenuItem] {
        items.filter { $0.categoryId == category.id }
    }

    var uncategorised: [AdminMenuItem] {
        items.filter { $0.categoryId == nil }
    }

    func load() async {
        if items.isEmpty && categories.isEmpty { phase = .loading }
        switch await repo.payload() {
        case .success(let p):
            categories = p.categories.sorted { $0.displayOrder < $1.displayOrder }
            items = p.items.sorted { $0.name < $1.name }
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }

    func toggleAvailability(_ item: AdminMenuItem) async {
        guard !working else { return }
        working = true
        lastError = nil
        defer { working = false }
        let input = MenuItemInput(
            name: item.name, description: item.description,
            pricePence: item.pricePence, categoryId: item.categoryId,
            imageUrl: item.imageUrl, available: !item.available,
            allergens: item.allergens ?? []
        )
        switch await repo.updateItem(id: item.id, input) {
        case .success(let updated):
            if let i = items.firstIndex(where: { $0.id == updated.id }) {
                items[i] = updated
            }
        case .failure(let e):
            lastError = e.displayMessage
        }
    }

    func save(input: MenuItemInput, editingId: String?) async -> Bool {
        guard !working else { return false }
        working = true
        lastError = nil
        defer { working = false }
        let result: ApiResult<AdminMenuItem>
        if let id = editingId {
            result = await repo.updateItem(id: id, input)
        } else {
            result = await repo.createItem(input)
        }
        switch result {
        case .success(let updated):
            if let i = items.firstIndex(where: { $0.id == updated.id }) {
                items[i] = updated
            } else {
                items.append(updated)
                items.sort { $0.name < $1.name }
            }
            return true
        case .failure(let e):
            lastError = e.displayMessage
            return false
        }
    }

    func delete(_ item: AdminMenuItem) async -> Bool {
        guard !working else { return false }
        working = true
        lastError = nil
        defer { working = false }
        let r = await repo.deleteItem(id: item.id)
        switch r {
        case .success:
            items.removeAll { $0.id == item.id }
            return true
        case .failure(let e):
            lastError = e.displayMessage
            return false
        }
    }
}
