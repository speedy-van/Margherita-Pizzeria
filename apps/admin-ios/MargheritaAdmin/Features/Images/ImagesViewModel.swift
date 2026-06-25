import Foundation

@MainActor
final class ImagesViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var items: [AdminImage] = []
    @Published var phase: Phase = .idle
    @Published var working: Bool = false
    @Published var lastError: String?

    private let repo: ImagesRepository
    init(repo: ImagesRepository) { self.repo = repo }

    func load() async {
        if items.isEmpty { phase = .loading }
        switch await repo.list() {
        case .success(let v):
            items = v.sorted { ($0.section ?? "") + $0.label < ($1.section ?? "") + $1.label }
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }

    func updateURL(id: String, url: String) async -> Bool {
        guard !working else { return false }
        working = true; lastError = nil
        defer { working = false }
        let r = await repo.update(id: id, url: url)
        switch r {
        case .success(let updated):
            if let i = items.firstIndex(where: { $0.id == updated.id }) { items[i] = updated }
            return true
        case .failure(let e):
            lastError = e.displayMessage; return false
        }
    }
}
