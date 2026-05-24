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

    private var soundPlayer: AVAudioPlayer?

    init(repo: DashboardRepository, session: SessionManager, router: RootRouter) {
        self.repo = repo
        self.session = session
        self.router = router
    }

    func attach(dialog: DialogController) {
        self.dialog = dialog
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
        notifyOS(title: "New order \(o.reference ?? o.id)",
                 body: "\(o.type.capitalized) · \(Format.pence(o.totalPence))")
        dialog?.show(
            title: "New order",
            message: "\(o.reference ?? o.id) · \(o.type.capitalized) · \(Format.pence(o.totalPence))",
            tone: .warning,
            actions: [
                .init(label: "Dismiss", style: .secondary),
                .init(label: "View", style: .primary) { [weak self] in
                    self?.router.navigateToOrder(o.id)
                }
            ],
            dismissOnBackdrop: false,
            onClose: { [weak self] in self?.stopSound() }
        )
    }

    private func fireBookingAlert(_ b: AdminBookingListItem) {
        startSound()
        notifyOS(title: "New booking \(b.reference ?? b.id)",
                 body: "\(b.covers) covers · \(b.date) \(b.timeSlot)")
        dialog?.show(
            title: "New booking",
            message: "\(b.covers) covers · \(b.date) \(b.timeSlot)",
            tone: .warning,
            actions: [
                .init(label: "Dismiss", style: .secondary),
                .init(label: "View", style: .primary) { [weak self] in
                    self?.router.navigateToBooking(b.id)
                }
            ],
            dismissOnBackdrop: false,
            onClose: { [weak self] in self?.stopSound() }
        )
    }

    // MARK: - Sound

    private func preloadSound() {
        guard soundPlayer == nil else { return }
        let url = Bundle.main.url(forResource: "new_order_alert", withExtension: "wav")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "caf")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "m4a")
        guard let url else { return }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = -1   // loop until dialog closes
            p.prepareToPlay()
            soundPlayer = p
        } catch {
            print("[Alerts] sound preload failed: \(error)")
        }
    }

    private func startSound() {
        if soundPlayer == nil { preloadSound() }
        soundPlayer?.currentTime = 0
        soundPlayer?.play()
        // Haptic + system sound as a fallback if the audio file isn't bundled.
        if soundPlayer == nil {
            AudioServicesPlaySystemSound(1304) // SMSReceived
        }
    }

    private func stopSound() {
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
            content.sound = .defaultCritical
            content.interruptionLevel = .timeSensitive
            let req = UNNotificationRequest(identifier: UUID().uuidString,
                                            content: content, trigger: nil)
            center.add(req)
        }
    }

    static func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound, .timeSensitive]
        ) { _, _ in }
    }
}
