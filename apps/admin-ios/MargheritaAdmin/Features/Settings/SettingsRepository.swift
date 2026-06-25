import Foundation

@MainActor
final class SettingsRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func get() async -> ApiResult<AdminSettings> {
        if api.isDemoMode { return .success(DemoData.getSettings()) }
        return await api.get("/api/admin/settings")
    }

    func update(_ input: AdminSettingsInput) async -> ApiResult<AdminSettings> {
        if api.isDemoMode { return .success(DemoData.updateSettings(input)) }
        await api.put("/api/admin/settings", body: input)
    }

    func timeSlots() async -> ApiResult<[AdminTimeSlot]> {
        if api.isDemoMode { return .success(DemoData.getTimeSlots()) }
        return await api.get("/api/admin/time-slots")
    }

    func createTimeSlot(_ input: AdminTimeSlotInput) async -> ApiResult<AdminTimeSlot> {
        if api.isDemoMode { return .success(DemoData.createTimeSlot(input)) }
        await api.post("/api/admin/time-slots", body: input)
    }

    func updateTimeSlot(_ slot: AdminTimeSlot) async -> ApiResult<AdminTimeSlot> {
        if api.isDemoMode { return .success(DemoData.updateTimeSlot(slot)) }
        await api.put("/api/admin/time-slots", body: slot)
    }

    func tables() async -> ApiResult<[AdminTable]> {
        if api.isDemoMode { return .success(DemoData.getTables()) }
        return await api.get("/api/admin/tables")
    }

    func updateTable(_ update: AdminTableUpdate) async -> ApiResult<AdminTable> {
        if api.isDemoMode {
            guard let table = DemoData.updateTable(update) else { return .failure(.notFound) }
            return .success(table)
        }
        await api.put("/api/admin/tables", body: update)
    }
}
