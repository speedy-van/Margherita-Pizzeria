import Foundation

@MainActor
final class DiscountsViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var items: [AdminDiscount] = []
    @Published var phase: Phase = .idle
    @Published var working: Bool = false
    @Published var lastError: String?

    private let repo: DiscountsRepository
    init(repo: DiscountsRepository) { self.repo = repo }

    func load() async {
        if items.isEmpty { phase = .loading }
        switch await repo.list() {
        case .success(let v):
            items = v.sorted { $0.code < $1.code }
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }

    func save(input: DiscountInput, editingId: String?) async -> Bool {
        working = true; lastError = nil
        let r = editingId == nil
            ? await repo.create(input)
            : await repo.update(id: editingId!, input)
        working = false
        switch r {
        case .success(let d):
            if let i = items.firstIndex(where: { $0.id == d.id }) {
                items[i] = d
            } else {
                items.append(d); items.sort { $0.code < $1.code }
            }
            return true
        case .failure(let e):
            lastError = e.displayMessage; return false
        }
    }

    func delete(_ d: AdminDiscount) async -> Bool {
        working = true; lastError = nil
        let r = await repo.delete(id: d.id)
        working = false
        switch r {
        case .success:
            items.removeAll { $0.id == d.id }
            return true
        case .failure(let e):
            lastError = e.displayMessage; return false
        }
    }
}
