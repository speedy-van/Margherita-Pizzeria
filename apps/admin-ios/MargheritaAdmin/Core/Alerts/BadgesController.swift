import Foundation
import AVFoundation
import UIKit
import UserNotifications

/// Mirrors admin-mobile `useBadges` + `alerts.ts`. Polls /api/admin/dashboard
/// every 8 s while signed in, diffs latestOrders/latestBookings against a
/// seen-set seeded on the FIRST poll (so we don't flood on launch), then
/// fires a dialog through `DialogController` and loops the alert sound until
/// the dialog closes.
@MainActor
final class BadgesController: ObservableObject {

    private let repo: DashboardRepository
    private let session: SessionManager
    private let router: RootRouter

    private var timerTask: Task<Void, Never>?
    private var seenOrderIDs: Set<String> = []
    private var seenBookingIDs: Set<String> = []
    private var seededOrders = false
    private var seededBookings = false

    @Published private(set) var pendingOrders: Int = 0
    @Published private(set) var pendingBookings: Int = 0

    private weak var dialog: DialogController?
    private weak var language: LanguageStore?

    private var soundPlayer: AVAudioPlayer?
    // Cancelled in stopSound(); guards against a dialog closing without triggering onClose.
    private var soundTimeoutTask: Task<Void, Never>?

    init(repo: DashboardRepository, session: SessionManager, router: RootRouter) {
        self.repo = repo
        self.session = session
        self.router = router
    }

    func attach(dialog: DialogController, language: LanguageStore) {
        self.dialog = dialog
        self.language = language
    }

    func start() {
        guard timerTask == nil else { return }
        // Pre-load sound so the first ring is instant.
        preloadSound()
        // Configure audio session for short alert playback that can mix
        // with other audio and respect the silent switch off.
        try? AVAudioSession.sharedInstance().setCategory(
            .playback,
            mode: .default,
            options: [.mixWithOthers, .duckOthers]
        )
        try? AVAudioSession.sharedInstance().setActive(true, options: [])

        timerTask = Task { [weak self] in
            // Tick immediately, then every 8 s.
            while !Task.isCancelled {
                await self?.tick()
                try? await Task.sleep(nanoseconds: 8 * 1_000_000_000)
            }
        }
    }

    func stop() {
        timerTask?.cancel()
        timerTask = nil
        stopSound()
        seenOrderIDs.removeAll()
        seenBookingIDs.removeAll()
        seededOrders = false
        seededBookings = false
    }

    private func tick() async {
        guard case .signedIn = session.state else { return }
        let res = await repo.get()
        guard case .success(let stats) = res else { return }
        pendingOrders = stats.pendingOrders
        pendingBookings = stats.pendingBookings

        // Orders
        var newOrderAlertable: AdminOrderListItem?
        for o in stats.latestOrders {
            if !seenOrderIDs.contains(o.id) {
                if seededOrders, ["received", "pending_payment"].contains(o.status.lowercased()) {
                    newOrderAlertable = o
                }
                seenOrderIDs.insert(o.id)
            }
        }
        seededOrders = true

        // Bookings
        var newBookingAlertable: AdminBookingListItem?
        for b in stats.latestBookings {
            if !seenBookingIDs.contains(b.id) {
                if seededBookings, b.status.lowercased() == "pending" {
                    newBookingAlertable = b
                }
                seenBookingIDs.insert(b.id)
            }
        }
        seededBookings = true

        // Fire ONE alert per tick (orders win). Subsequent items still get
        // recorded so they don't re-alert next tick.
        if let o = newOrderAlertable {
            fireOrderAlert(o)
        } else if let b = newBookingAlertable {
            fireBookingAlert(b)
        }
    }

    private func fireOrderAlert(_ o: AdminOrderListItem) {
        startSound()
        let ref = o.reference ?? o.id
        let body = "\(orderType(o.type)) · \(Format.pence(o.totalPence))"
        notifyOS(title: "\(text("New order")) \(ref)", body: body)
        dialog?.show(
            title: text("New order"),
            message: "\(ref) · \(body)",
            tone: .warning,
            actions: [
                .init(label: text("Dismiss"), style: .secondary),
                .init(label: text("View"), style: .primary) { [weak self] in
                    self?.router.navigateToOrder(o.id)
                }
            ],
            dismissOnBackdrop: false,
            onClose: { [weak self] in self?.stopSound() }
        )
    }

    private func fireBookingAlert(_ b: AdminBookingListItem) {
        startSound()
        let ref = b.reference ?? b.id
        let body = "\(b.covers) \(text("covers")) · \(b.date) \(b.timeSlot)"
        notifyOS(title: "\(text("New booking")) \(ref)", body: body)
        dialog?.show(
            title: text("New booking"),
            message: body,
            tone: .warning,
            actions: [
                .init(label: text("Dismiss"), style: .secondary),
                .init(label: text("View"), style: .primary) { [weak self] in
                    self?.router.navigateToBooking(b.id)
                }
            ],
            dismissOnBackdrop: false,
            onClose: { [weak self] in self?.stopSound() }
        )
    }

    private func text(_ key: String) -> String {
        language?.text(key) ?? key
    }

    private func orderType(_ raw: String) -> String {
        language?.orderType(raw) ?? raw.capitalized
    }

    // MARK: - Sound

    private func preloadSound() {
        guard soundPlayer == nil else { return }
        let url = Bundle.main.url(forResource: "new_order_alert", withExtension: "wav")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "caf")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "m4a")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "mp3")
        guard let url else { return }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = -1   // loop until dialog closes
            p.prepareToPlay()
            soundPlayer = p
        } catch {
            // Keep silent in production; fallback haptic/system sound still works.
        }
    }

    private func startSound() {
        // Cancel any previous timeout so each new alert gets a fresh window.
        soundTimeoutTask?.cancel()
        soundTimeoutTask = nil

        if soundPlayer == nil { preloadSound() }
        soundPlayer?.currentTime = 0
        soundPlayer?.play()
        // Haptic + system sound as a fallback if the audio file isn't bundled.
        if soundPlayer == nil {
            AudioServicesPlaySystemSound(1304) // SMSReceived
        }

        // Safety valve: stop after 3 minutes even if the dialog's onClose is never called.
        soundTimeoutTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 3 * 60 * 1_000_000_000)
            guard !Task.isCancelled else { return }
            self?.stopSound()
        }
    }

    private func stopSound() {
        soundTimeoutTask?.cancel()
        soundTimeoutTask = nil
        soundPlayer?.stop()
        soundPlayer?.currentTime = 0
    }

    // MARK: - OS-level local notification (so background buzzes still work)

    private func notifyOS(title: String, body: String) {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized else { return }
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = body
            content.sound = .default
            content.interruptionLevel = .active
            let req = UNNotificationRequest(identifier: UUID().uuidString,
                                            content: content, trigger: nil)
            center.add(req)
        }
    }

    static func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { _, _ in }
    }
}
