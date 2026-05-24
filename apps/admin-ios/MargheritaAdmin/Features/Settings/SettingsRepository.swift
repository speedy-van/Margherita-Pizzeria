import Foundation

@MainActor
final class SettingsRepository {
    private let api: ApiClient
    init(api: ApiClient) { self.api = api }

    func get() async -> ApiResult<AdminSettings> { await api.get("/api/admin/settings") }
    func update(_ input: AdminSettingsInput) async -> ApiResult<AdminSettings> {
        await api.put("/api/admin/settings", body: input)
    }

    func timeSlots() async -> ApiResult<[AdminTimeSlot]> { await api.get("/api/admin/time-slots") }
    func createTimeSlot(_ input: AdminTimeSlotInput) async -> ApiResult<AdminTimeSlot> {
        await api.post("/api/admin/time-slots", body: input)
    }
    func updateTimeSlot(_ slot: AdminTimeSlot) async -> ApiResult<AdminTimeSlot> {
        await api.put("/api/admin/time-slots", body: slot)
    }

    func tables() async -> ApiResult<[AdminTable]> { await api.get("/api/admin/tables") }
    func updateTable(_ update: AdminTableUpdate) async -> ApiResult<AdminTable> {
        await api.put("/api/admin/tables", body: update)
    }
}
