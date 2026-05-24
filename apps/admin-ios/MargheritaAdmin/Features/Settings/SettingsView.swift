import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @StateObject private var vm: SettingsViewModel

    @State private var deliveryFeeText: String = ""
    @State private var freeDeliveryText: String = ""
    @State private var description: String = ""

    @State private var newSlotStart: String = "12:00"
    @State private var newSlotEnd: String = "12:30"
    @State private var newSlotSeats: String = "20"

    private let days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeSettingsViewModel())
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.settings == nil {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.settings == nil {
                ErrorState(message: m) { Task { await vm.loadAll() } }
            } else {
                Form {
                    generalSection
                    openingHoursSection
                    timeSlotsSection
                    tablesSection
                    alertTestSection
                    if let e = vm.lastError {
                        Section {
                            Label(e, systemImage: "exclamationmark.triangle.fill")
                                .foregroundStyle(AppTheme.danger).font(.subheadline)
                        }
                    }
                    if let m = vm.lastSavedMessage {
                        Section {
                            Label(m, systemImage: "checkmark.circle.fill")
                                .foregroundStyle(AppTheme.success).font(.subheadline)
                        }
                    }
                }
                .scrollContentBackground(.hidden)
                .background(AppTheme.background)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle("Settings")
        .task {
            await vm.loadAll()
            hydrate()
        }
        .refreshable { await vm.loadAll(); hydrate() }
    }

    private func hydrate() {
        guard let s = vm.settings else { return }
        deliveryFeeText = String(format: "%.2f", Double(s.deliveryFeeBasePence) / 100.0)
        freeDeliveryText = String(format: "%.2f", Double(s.freeDeliveryThresholdPence) / 100.0)
        description = s.description ?? ""
    }

    @ViewBuilder private var generalSection: some View {
        Section("General") {
            HStack {
                Text("Delivery fee (£)"); Spacer()
                TextField("0.00", text: $deliveryFeeText)
                    .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }
            HStack {
                Text("Free delivery over (£)"); Spacer()
                TextField("0.00", text: $freeDeliveryText)
                    .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }
            TextField("Restaurant description", text: $description, axis: .vertical)
                .lineLimit(2...5)
            Button(vm.working ? "Saving…" : "Save general") {
                guard var s = vm.settings else { return }
                s.deliveryFeeBasePence = parsePence(deliveryFeeText) ?? s.deliveryFeeBasePence
                s.freeDeliveryThresholdPence = parsePence(freeDeliveryText) ?? s.freeDeliveryThresholdPence
                s.description = description.isEmpty ? nil : description
                Task { await vm.saveSettings(s) }
            }
            .disabled(vm.working || vm.settings == nil)
        }
    }

    @ViewBuilder private var openingHoursSection: some View {
        Section("Opening hours") {
            if vm.settings == nil {
                Text("—").foregroundStyle(.secondary)
            } else {
                ForEach(days, id: \.self) { day in
                    let sched = vm.settings?.openingHours[day] ?? AdminDaySchedule(isOpen: false, opensAt: nil, closesAt: nil)
                    Toggle(isOn: Binding(
                        get: { sched.isOpen },
                        set: { newVal in
                            var s = sched; s.isOpen = newVal
                            vm.settings?.openingHours[day] = s
                        }
                    )) {
                        HStack {
                            Text(dayLabel(day)).frame(width: 60, alignment: .leading)
                            if sched.isOpen {
                                TextField("09:00", text: Binding(
                                    get: { sched.opensAt ?? "" },
                                    set: { vm.settings?.openingHours[day]?.opensAt = $0 }
                                ))
                                .frame(width: 70)
                                Text("–")
                                TextField("22:00", text: Binding(
                                    get: { sched.closesAt ?? "" },
                                    set: { vm.settings?.openingHours[day]?.closesAt = $0 }
                                ))
                                .frame(width: 70)
                            } else {
                                Text("Closed").foregroundStyle(.secondary)
                            }
                        }
                    }
                    .tint(AppTheme.primary)
                }
                Button(vm.working ? "Saving…" : "Save opening hours") {
                    guard let s = vm.settings else { return }
                    Task { await vm.saveSettings(s) }
                }
                .disabled(vm.working)
            }
        }
    }

    @ViewBuilder private var timeSlotsSection: some View {
        Section("Time slots") {
            ForEach(vm.timeSlots) { slot in
                HStack {
                    Text("\(slot.startTime) – \(slot.endTime)")
                    Spacer()
                    Stepper("\(slot.seats) seats", value: Binding(
                        get: { slot.seats },
                        set: { newVal in
                            var s = slot; s.seats = newVal
                            Task { await vm.updateTimeSlot(s) }
                        }
                    ), in: 1...100)
                    .frame(width: 150)
                    Toggle("", isOn: Binding(
                        get: { slot.active },
                        set: { newVal in
                            var s = slot; s.active = newVal
                            Task { await vm.updateTimeSlot(s) }
                        }
                    )).labelsHidden().tint(AppTheme.primary)
                }
            }
            HStack {
                TextField("Start", text: $newSlotStart).frame(width: 60)
                TextField("End", text: $newSlotEnd).frame(width: 60)
                TextField("Seats", text: $newSlotSeats).keyboardType(.numberPad).frame(width: 60)
                Button("Add") {
                    guard let seats = Int(newSlotSeats) else { return }
                    Task { _ = await vm.addTimeSlot(start: newSlotStart, end: newSlotEnd, seats: seats) }
                }
                .buttonStyle(.borderedProminent).tint(AppTheme.primary)
                .disabled(vm.working || newSlotStart.isEmpty || newSlotEnd.isEmpty || Int(newSlotSeats) == nil)
            }
        }
    }

    @ViewBuilder private var tablesSection: some View {
        Section("Tables") {
            if vm.tables.isEmpty {
                Text("No tables configured.").foregroundStyle(.secondary)
            } else {
                ForEach(vm.tables) { table in
                    HStack {
                        Text("Table #\(table.number)")
                        Spacer()
                        Stepper("\(table.seats) seats", value: Binding(
                            get: { table.seats },
                            set: { newVal in
                                var t = table; t.seats = newVal
                                Task { await vm.updateTable(t) }
                            }
                        ), in: 1...20).frame(width: 150)
                        Toggle("", isOn: Binding(
                            get: { table.active },
                            set: { newVal in
                                var t = table; t.active = newVal
                                Task { await vm.updateTable(t) }
                            }
                        )).labelsHidden().tint(AppTheme.primary)
                    }
                }
            }
        }
    }

    @ViewBuilder private var alertTestSection: some View {
        Section("Alerts") {
            Button {
                dialog.show(
                    title: "Test alert",
                    message: "If you can hear this, audio alerts are wired correctly.",
                    tone: .warning,
                    actions: [
                        .init(label: "Dismiss", style: .secondary)
                    ],
                    dismissOnBackdrop: false
                )
            } label: {
                Label("Fire test alert", systemImage: "bell.badge.fill")
            }
            Button {
                BadgesController.requestNotificationPermission()
            } label: {
                Label("Re-request notification permission", systemImage: "app.badge")
            }
        }
    }

    private func dayLabel(_ d: String) -> String {
        ["mon":"Mon","tue":"Tue","wed":"Wed","thu":"Thu","fri":"Fri","sat":"Sat","sun":"Sun"][d] ?? d
    }

    private func parsePence(_ s: String) -> Int? {
        let t = s.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)
        guard let d = Double(t), d >= 0 else { return nil }
        return Int((d * 100).rounded())
    }
}
