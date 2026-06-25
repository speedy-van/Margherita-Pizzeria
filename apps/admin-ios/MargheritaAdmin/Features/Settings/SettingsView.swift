import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var dialog: DialogController
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: SettingsViewModel

    @State private var minDeliveryText: String = ""
    @State private var deliveryFeeText: String = ""
    @State private var prepTimeText: String = ""
    @State private var deliveryTimeText: String = ""
    @State private var depositEnabled: Bool = false
    @State private var depositAmountText: String = ""

    @State private var newSlotType: String = "collection"
    @State private var newSlotTime: String = "12:00"

    private let days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

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
                            Label(language.text(m), systemImage: "checkmark.circle.fill")
                                .foregroundStyle(AppTheme.success).font(.subheadline)
                        }
                    }
                }
                .scrollContentBackground(.hidden)
                .background(AppTheme.background)
            }
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(language.text("Settings"))
        .task {
            await vm.loadAll()
            hydrate()
        }
        .refreshable { await vm.loadAll(); hydrate() }
    }

    private func hydrate() {
        guard let s = vm.settings else { return }
        minDeliveryText = String(format: "%.2f", Double(s.minDeliveryOrderPence) / 100.0)
        deliveryFeeText = String(format: "%.2f", Double(s.deliveryFeePence) / 100.0)
        prepTimeText = String(s.prepTimeMinutes)
        deliveryTimeText = String(s.deliveryTimeMinutes)
        depositEnabled = s.depositEnabled
        depositAmountText = String(format: "%.2f", Double(s.depositAmountPence) / 100.0)
    }

    @ViewBuilder private var generalSection: some View {
        Section(language.text("General")) {
            HStack {
                Text(language.text("Min delivery order (£)")); Spacer()
                TextField("0.00", text: $minDeliveryText)
                    .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }
            HStack {
                Text(language.text("Delivery fee (£)")); Spacer()
                TextField("0.00", text: $deliveryFeeText)
                    .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }
            HStack {
                Text(language.text("Prep time (min)")); Spacer()
                TextField("25", text: $prepTimeText)
                    .keyboardType(.numberPad).multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }
            HStack {
                Text(language.text("Delivery time (min)")); Spacer()
                TextField("45", text: $deliveryTimeText)
                    .keyboardType(.numberPad).multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }
            Toggle(language.text("Deposit enabled"), isOn: $depositEnabled)
                .tint(AppTheme.primary)
            if depositEnabled {
                HStack {
                    Text(language.text("Deposit amount (£)")); Spacer()
                    TextField("0.00", text: $depositAmountText)
                        .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
                        .frame(width: 100)
                }
            }
            Button(vm.working ? language.text("Saving…") : language.text("Save general")) {
                guard var s = vm.settings else { return }
                s.minDeliveryOrderPence = parsePence(minDeliveryText) ?? s.minDeliveryOrderPence
                s.deliveryFeePence = parsePence(deliveryFeeText) ?? s.deliveryFeePence
                s.prepTimeMinutes = Int(prepTimeText) ?? s.prepTimeMinutes
                s.deliveryTimeMinutes = Int(deliveryTimeText) ?? s.deliveryTimeMinutes
                s.depositEnabled = depositEnabled
                s.depositAmountPence = parsePence(depositAmountText) ?? s.depositAmountPence
                Task { await vm.saveSettings(s) }
            }
            .disabled(vm.working || vm.settings == nil)
        }
    }

    @ViewBuilder private var openingHoursSection: some View {
        Section(language.text("Opening hours")) {
            if vm.settings == nil {
                Text("—").foregroundStyle(.secondary)
            } else {
                ForEach(days, id: \.self) { day in
                    let sched = vm.settings?.openingHours[day] ?? AdminDaySchedule()
                    Toggle(isOn: Binding(
                        get: { sched.closed != true },
                        set: { newVal in
                            var s = sched; s.closed = !newVal
                            vm.settings?.openingHours[day] = s
                        }
                    )) {
                        HStack {
                            Text(dayLabel(day)).frame(width: 60, alignment: .leading)
                            if sched.closed != true {
                                TextField("09:00", text: Binding(
                                    get: { sched.open },
                                    set: {
                                        var s = vm.settings?.openingHours[day] ?? sched
                                        s.open = $0
                                        vm.settings?.openingHours[day] = s
                                    }
                                ))
                                .frame(width: 70)
                                Text("–")
                                TextField("22:00", text: Binding(
                                    get: { sched.close },
                                    set: {
                                        var s = vm.settings?.openingHours[day] ?? sched
                                        s.close = $0
                                        vm.settings?.openingHours[day] = s
                                    }
                                ))
                                .frame(width: 70)
                            } else {
                                Text(language.text("Closed")).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .tint(AppTheme.primary)
                }
                Button(vm.working ? language.text("Saving…") : language.text("Save opening hours")) {
                    guard let s = vm.settings else { return }
                    Task { await vm.saveSettings(s) }
                }
                .disabled(vm.working)
            }
        }
    }

    @ViewBuilder private var timeSlotsSection: some View {
        Section(language.text("Time slots")) {
            ForEach(vm.timeSlots) { slot in
                HStack {
                    VStack(alignment: .leading) {
                        Text(slot.time)
                        Text(language.orderType(slot.type)).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
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
                Picker(language.text("Type"), selection: $newSlotType) {
                    Text(language.text("Collection")).tag("collection")
                    Text(language.text("Booking")).tag("booking")
                }
                .pickerStyle(.menu)
                TextField(language.text("Time"), text: $newSlotTime).frame(width: 70)
                Button(language.text("Add")) {
                    Task { _ = await vm.addTimeSlot(type: newSlotType, time: newSlotTime) }
                }
                .buttonStyle(.borderedProminent).tint(AppTheme.primary)
                .disabled(vm.working || newSlotTime.isEmpty)
            }
        }
    }

    @ViewBuilder private var tablesSection: some View {
        Section(language.text("Tables")) {
            if vm.tables.isEmpty {
                Text(language.text("No tables configured.")).foregroundStyle(.secondary)
            } else {
                ForEach(vm.tables) { table in
                    HStack {
                        Text("\(language.text("Table")) #\(table.number)")
                        Spacer()
                        Stepper("\(table.maxCovers) \(language.text("covers"))", value: Binding(
                            get: { table.maxCovers },
                            set: { newVal in
                                var t = table; t.maxCovers = newVal
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
        Section(language.text("Alerts")) {
            Button {
                dialog.show(
                    title: language.text("Alerts"),
                    message: language.text("If you can hear this, audio alerts are wired correctly."),
                    tone: .warning,
                    actions: [
                        .init(label: language.text("Dismiss"), style: .secondary)
                    ],
                    dismissOnBackdrop: false
                )
            } label: {
                Label(language.text("Fire test alert"), systemImage: "bell.badge.fill")
            }
            Button {
                BadgesController.requestNotificationPermission()
            } label: {
                Label(language.text("Re-request notification permission"), systemImage: "app.badge")
            }
        }
    }

    private func dayLabel(_ d: String) -> String {
        language.text("day.\(d).short")
    }

    private func parsePence(_ s: String) -> Int? {
        let t = s.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)
        guard let d = Double(t), d >= 0 else { return nil }
        return Int((d * 100).rounded())
    }
}
