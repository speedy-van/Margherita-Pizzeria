import Foundation

@MainActor
final class SettingsViewModel: ObservableObject {
    enum Phase: Equatable { case idle, loading, loaded, failed(String) }
    @Published var settings: AdminSettings?
    @Published var timeSlots: [AdminTimeSlot] = []
    @Published var tables: [AdminTable] = []
    @Published var phase: Phase = .idle
    @Published var working: Bool = false
    @Published var lastError: String?
    @Published var lastSavedMessage: String?

    private let repo: SettingsRepository
    init(repo: SettingsRepository) { self.repo = repo }

    func loadAll() async {
        if settings == nil { phase = .loading }
        async let s = repo.get()
        async let ts = repo.timeSlots()
        async let tb = repo.tables()
        let (settingsR, timeSlotsR, tablesR) = await (s, ts, tb)

        var anyFail: String?
        if case .success(let v) = settingsR { settings = v } else if case .failure(let e) = settingsR { anyFail = e.displayMessage }
        if case .success(let v) = timeSlotsR { timeSlots = v.sorted { $0.time < $1.time } }
        if case .success(let v) = tablesR { tables = v.sorted { $0.number < $1.number } }
        phase = anyFail.map { .failed($0) } ?? .loaded
    }

    func saveSettings(_ s: AdminSettings) async {
        guard !working else { return }
        working = true; lastError = nil
        defer { working = false }
        let input = AdminSettingsInput(
            minDeliveryOrderPence: s.minDeliveryOrderPence,
            deliveryFeePence: s.deliveryFeePence,
            prepTimeMinutes: s.prepTimeMinutes,
            deliveryTimeMinutes: s.deliveryTimeMinutes,
            depositEnabled: s.depositEnabled,
            depositAmountPence: s.depositAmountPence,
            openingHours: s.openingHours
        )
        switch await repo.update(input) {
        case .success(let updated):
            settings = updated
            lastSavedMessage = "Settings saved."
        case .failure(let e):
            lastError = e.displayMessage
        }
    }

    func addTimeSlot(type: String, time: String) async -> Bool {
        guard !working else { return false }
        working = true; lastError = nil
        defer { working = false }
        let r = await repo.createTimeSlot(AdminTimeSlotInput(type: type, time: time, active: true))
        switch r {
        case .success(let s):
            timeSlots.append(s); timeSlots.sort { $0.time < $1.time }
            return true
        case .failure(let e):
            lastError = e.displayMessage; return false
        }
    }

    func updateTimeSlot(_ slot: AdminTimeSlot) async {
        guard !working else { return }
        working = true; lastError = nil
        defer { working = false }
        switch await repo.updateTimeSlot(slot) {
        case .success(let s):
            if let i = timeSlots.firstIndex(where: { $0.id == s.id }) { timeSlots[i] = s }
        case .failure(let e):
            lastError = e.displayMessage
        }
    }

    func updateTable(_ table: AdminTable) async {
        guard !working else { return }
        working = true; lastError = nil
        defer { working = false }
        let upd = AdminTableUpdate(id: table.id, maxCovers: table.maxCovers, active: table.active)
        switch await repo.updateTable(upd) {
        case .success(let t):
            if let i = tables.firstIndex(where: { $0.id == t.id }) { tables[i] = t }
        case .failure(let e):
            lastError = e.displayMessage
        }
    }
}
