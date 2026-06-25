import Foundation

@MainActor
final class OrdersListViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var items: [AdminOrderListItem] = []
    @Published var phase: Phase = .idle
    @Published var statusFilter: String? = nil   // nil = all
    @Published var typeFilter: String? = nil     // "delivery" / "collection" / nil
    @Published var search: String = ""

    private let repo: OrdersRepository
    init(repo: OrdersRepository) { self.repo = repo }

    var filtered: [AdminOrderListItem] {
        items.filter { o in
            if let s = statusFilter, o.status.lowercased() != s.lowercased() { return false }
            if let t = typeFilter, o.type.lowercased() != t.lowercased() { return false }
            if !search.isEmpty {
                let q = search.lowercased()
                let hay = [o.reference, o.customerName, o.customerPhone, o.customerEmail]
                    .compactMap { $0?.lowercased() }
                if !hay.contains(where: { $0.contains(q) }) { return false }
            }
            return true
        }
    }

    func load() async {
        if items.isEmpty { phase = .loading }
        switch await repo.list() {
        case .success(let list):
            // Sort newest first by createdAt.
            items = list.sorted { $0.createdAt > $1.createdAt }
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }
}

@MainActor
final class OrderDetailViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var detail: AdminOrderDetail?
    @Published var phase: Phase = .idle
    @Published var updatingStatus: String? = nil
    @Published var lastError: String?

    let id: String
    private let repo: OrdersRepository
    init(id: String, repo: OrdersRepository) { self.id = id; self.repo = repo }

    func load() async {
        if detail == nil { phase = .loading }
        switch await repo.detail(id: id) {
        case .success(let d): detail = d; phase = .loaded
        case .failure(let e): phase = .failed(e.displayMessage)
        }
    }

    func updateStatus(_ status: String) async {
        guard updatingStatus == nil else { return }
        if detail?.status.lowercased() == status.lowercased() { return }
        updatingStatus = status
        lastError = nil
        defer { updatingStatus = nil }
        switch await repo.updateStatus(id: id, status: status) {
        case .success(let d):  detail = d
        case .failure(let e):  lastError = e.displayMessage
        }
    }
}
