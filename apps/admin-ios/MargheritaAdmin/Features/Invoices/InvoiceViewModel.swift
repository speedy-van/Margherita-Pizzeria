import Foundation

// MARK: – Invoice list (one row per order)

@MainActor
final class InvoicesListViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }

    @Published var items:  [AdminOrderListItem] = []
    @Published var phase:  Phase = .idle
    @Published var search: String = ""

    private let repo: OrdersRepository
    init(repo: OrdersRepository) { self.repo = repo }

    var filtered: [AdminOrderListItem] {
        guard !search.isEmpty else { return items }
        let q = search.lowercased()
        return items.filter {
            let hay = [$0.reference, $0.customerName, $0.customerEmail, $0.customerPhone]
                .compactMap { $0?.lowercased() }
            return hay.contains { $0.contains(q) }
        }
    }

    func load() async {
        if items.isEmpty { phase = .loading }
        switch await repo.list() {
        case .success(let list):
            items = list.sorted { $0.createdAt > $1.createdAt }
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }
}

// MARK: – Invoice detail (single order → PDF)

@MainActor
final class InvoiceDetailViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }

    @Published var detail:  AdminOrderDetail?
    @Published var phase:   Phase = .idle
    @Published var pdfData: Data?
    @Published var emailTo: String = ""

    let orderId: String
    private let repo: OrdersRepository

    init(orderId: String, repo: OrdersRepository) {
        self.orderId = orderId
        self.repo    = repo
    }

    func load() async {
        if detail == nil { phase = .loading }
        switch await repo.detail(id: orderId) {
        case .success(let d):
            detail  = d
            emailTo = d.customerEmail ?? ""
            phase   = .loaded
            generatePDF()
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }

    func generatePDF() {
        guard let detail else { return }
        pdfData = InvoicePDFRenderer.render(InvoiceDocument(order: detail))
    }
}
