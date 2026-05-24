import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var stats: AdminDashboardStats?
    @Published var phase: Phase = .idle

    private let repo: DashboardRepository
    init(repo: DashboardRepository) { self.repo = repo }

    func load() async {
        if stats == nil { phase = .loading }
        switch await repo.get() {
        case .success(let s):
            stats = s
            phase = .loaded
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }
}
