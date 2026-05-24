import Foundation

@MainActor
final class BookingsListViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var items: [AdminBookingListItem] = []
    @Published var phase: Phase = .idle
    @Published var statusFilter: String? = nil
    @Published var dateFilter: String? = nil   // "YYYY-MM-DD" or nil

    private let repo: BookingsRepository
    init(repo: BookingsRepository) { self.repo = repo }

    var filtered: [AdminBookingListItem] {
        items.filter { b in
            if let s = statusFilter, b.status.lowercased() != s.lowercased() { return false }
            if let d = dateFilter, !b.date.hasPrefix(d) { return false }
            return true
        }
    }

    func load() async {
        if items.isEmpty { phase = .loading }
        switch await repo.list() {
        case .success(let list):
            items = list.sorted { ($0.date, $0.timeSlot) < ($1.date, $1.timeSlot) }
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }
}

@MainActor
final class BookingDetailViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var detail: AdminBookingDetail?
    @Published var phase: Phase = .idle
    @Published var updatingStatus: String? = nil
    @Published var lastError: String?

    let id: String
    private let repo: BookingsRepository
    init(id: String, repo: BookingsRepository) { self.id = id; self.repo = repo }

    func load() async {
        if detail == nil { phase = .loading }
        switch await repo.detail(id: id) {
        case .success(let d): detail = d; phase = .loaded
        case .failure(let e): phase = .failed(e.displayMessage)
        }
    }

    func updateStatus(_ status: String) async {
        updatingStatus = status
        lastError = nil
        switch await repo.updateStatus(id: id, status: status) {
        case .success(let d): detail = d
        case .failure(let e): lastError = e.displayMessage
        }
        updatingStatus = nil
    }
}
