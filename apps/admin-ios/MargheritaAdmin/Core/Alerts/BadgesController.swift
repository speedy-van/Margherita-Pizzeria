import Foundation
import AVFoundation
import UIKit
import UserNotifications

/// Mirrors admin-mobile `useBadges` + `alerts.ts`. Polls the lightweight
/// dashboard badge view every 8 s while signed in and foregrounded, diffs
/// latestOrders/latestBookings against a
/// seen-set seeded on the FIRST poll (so we don't flood on launch), then
/// fires a dialog through `DialogController` and loops the alert sound until
/// the dialog closes.
@MainActor
final class BadgesController: ObservableObject {
    private static let seenOrderIDsKey = "margherita-admin-ios.alerted-order-ids.v1"
    private static let seenBookingIDsKey = "margherita-admin-ios.alerted-booking-ids.v1"
    private static let maxStoredSeenIDs = 120
    private static let firstPollAlertWindow: TimeInterval = 10 * 60
    private static let pollInterval: TimeInterval = 8
    private static let maxRetryDelay: TimeInterval = 60

    private let repo: DashboardRepository
    private let session: SessionManager
    private let router: RootRouter

    private var timerTask: Task<Void, Never>?
    private var seenOrderIDs: Set<String> = []
    private var seenBookingIDs: Set<String> = []
    private var seededOrders = false
    private var seededBookings = false
    private var isAppActive = true
    private var tickInFlight = false
    private var pendingTick = false
    private var failureCount = 0
    private var nextAllowedPollAt: Date?
    private var didBecomeActiveObserver: NSObjectProtocol?
    private var willResignActiveObserver: NSObjectProtocol?

    @Published private(set) var pendingOrders: Int = 0
    @Published private(set) var pendingBookings: Int = 0

    private weak var dialog: DialogController?
    private weak var language: LanguageStore?

    private var soundPlayer: AVAudioPlayer?
    private static var testSoundPlayer: AVAudioPlayer?
    // Cancelled in stopSound(); guards against a dialog closing without triggering onClose.
    private var soundTimeoutTask: Task<Void, Never>?

    init(repo: DashboardRepository, session: SessionManager, router: RootRouter) {
        self.repo = repo
        self.session = session
        self.router = router
    }

    deinit {
        removeLifecycleObservers()
    }

    func attach(dialog: DialogController, language: LanguageStore) {
        self.dialog = dialog
        self.language = language
    }

    func start() {
        guard timerTask == nil else { return }
        isAppActive = UIApplication.shared.applicationState == .active
        installLifecycleObservers()
        seenOrderIDs = Self.loadSeenIDs(key: Self.seenOrderIDsKey)
        seenBookingIDs = Self.loadSeenIDs(key: Self.seenBookingIDsKey)
        // Pre-load sound so the first ring is instant.
        preloadSound()
        Self.configureAudioSession()

        timerTask = Task { [weak self] in
            // Tick immediately, then every 8 s.
            while !Task.isCancelled {
                if self?.isAppActive == true {
                    await self?.tick()
                }
                try? await Task.sleep(nanoseconds: UInt64(Self.pollInterval * 1_000_000_000))
            }
        }
    }

    func stop() {
        timerTask?.cancel()
        timerTask = nil
        removeLifecycleObservers()
        stopSound()
        seenOrderIDs.removeAll()
        seenBookingIDs.removeAll()
        seededOrders = false
        seededBookings = false
        tickInFlight = false
        pendingTick = false
        failureCount = 0
        nextAllowedPollAt = nil
    }

    private func tick() async {
        guard isAppActive, let requestSessionKey = currentSessionKey() else { return }
        if let nextAllowedPollAt, Date() < nextAllowedPollAt { return }
        if tickInFlight {
            pendingTick = true
            return
        }
        tickInFlight = true
        defer {
            tickInFlight = false
            if pendingTick, isAppActive, currentSessionKey() != nil {
                pendingTick = false
                Task { [weak self] in await self?.tick() }
            } else {
                pendingTick = false
            }
        }

        let res = await repo.badges()
        guard isAppActive, currentSessionKey() == requestSessionKey else { return }
        let stats: AdminDashboardStats
        switch res {
        case .success(let value):
            failureCount = 0
            nextAllowedPollAt = nil
            stats = value
        case .failure(let error):
            handlePollFailure(error)
            return
        }
        pendingOrders = stats.pendingOrders
        pendingBookings = stats.pendingBookings

        // Orders. Do not mark `pending_payment` as seen: card orders are
        // created before Stripe confirms payment, then transition to received.
        // Marking them early causes the real paid order alert to be missed.
        let alertableOrders = stats.latestOrders.filter { isOrderAlertable($0) }
        if !seededOrders {
            let oldOrders = alertableOrders.filter { !isRecentForFirstPoll($0.createdAt) }
            seenOrderIDs.formUnion(oldOrders.map(\.id))
            seededOrders = true
        }

        // Bookings
        let alertableBookings = stats.latestBookings.filter { $0.status.lowercased() == "pending" }
        if !seededBookings {
            let oldBookings = alertableBookings.filter { !isRecentForFirstPoll($0.createdAt) }
            seenBookingIDs.formUnion(oldBookings.map(\.id))
            seededBookings = true
        }

        // Fire one alert per tick, and wait if another dialog is already open.
        // Unfired items are left unseen so the next poll can alert them.
        guard dialog?.current == nil else { return }
        if let o = alertableOrders.first(where: { !seenOrderIDs.contains($0.id) }) {
            rememberSeenOrder(o.id)
            fireOrderAlert(o)
        } else if let b = alertableBookings.first(where: { !seenBookingIDs.contains($0.id) }) {
            rememberSeenBooking(b.id)
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

    private func currentSessionKey() -> String? {
        guard case .signedIn(let user) = session.state else { return nil }
        return "\(user.id):\(session.currentToken ?? "dev-bypass")"
    }

    private func handlePollFailure(_ error: ApiFailure) {
        if case .unauthorized = error { return }
        if case .forbidden = error { return }
        failureCount += 1
        let exponent = max(0, failureCount - 1)
        let base = min(Self.maxRetryDelay, Self.pollInterval * pow(2, Double(exponent)))
        let jitter = base * Double.random(in: 0...0.2)
        nextAllowedPollAt = Date().addingTimeInterval(min(Self.maxRetryDelay, base + jitter))
    }

    private func installLifecycleObservers() {
        guard didBecomeActiveObserver == nil, willResignActiveObserver == nil else { return }
        let center = NotificationCenter.default
        didBecomeActiveObserver = center.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isAppActive = true
                await self?.tick()
            }
        }
        willResignActiveObserver = center.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isAppActive = false
            }
        }
    }

    private func removeLifecycleObservers() {
        let center = NotificationCenter.default
        if let didBecomeActiveObserver {
            center.removeObserver(didBecomeActiveObserver)
            self.didBecomeActiveObserver = nil
        }
        if let willResignActiveObserver {
            center.removeObserver(willResignActiveObserver)
            self.willResignActiveObserver = nil
        }
    }

    private func isOrderAlertable(_ order: AdminOrderListItem) -> Bool {
        order.status.lowercased() == "received"
    }

    private func isRecentForFirstPoll(_ createdAt: String) -> Bool {
        guard let date = Self.parseDate(createdAt) else { return false }
        return Date().timeIntervalSince(date) <= Self.firstPollAlertWindow
    }

    private func rememberSeenOrder(_ id: String) {
        seenOrderIDs.insert(id)
        Self.persistSeenIDs(seenOrderIDs, key: Self.seenOrderIDsKey)
    }

    private func rememberSeenBooking(_ id: String) {
        seenBookingIDs.insert(id)
        Self.persistSeenIDs(seenBookingIDs, key: Self.seenBookingIDsKey)
    }

    private static func loadSeenIDs(key: String) -> Set<String> {
        Set(UserDefaults.standard.stringArray(forKey: key) ?? [])
    }

    private static func persistSeenIDs(_ ids: Set<String>, key: String) {
        let trimmed = Array(ids).suffix(maxStoredSeenIDs)
        UserDefaults.standard.set(Array(trimmed), forKey: key)
    }

    private static func parseDate(_ raw: String) -> Date? {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractional.date(from: raw) { return date }

        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        return plain.date(from: raw)
    }

    // MARK: - Sound

    private func preloadSound() {
        guard soundPlayer == nil else { return }
        let url = Self.alertSoundURL()
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
        Self.configureAudioSession()
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

    private static func alertSoundURL() -> URL? {
        Bundle.main.url(forResource: "new_order_alert", withExtension: "wav")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "caf")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "m4a")
            ?? Bundle.main.url(forResource: "new_order_alert", withExtension: "mp3")
    }

    private static func configureAudioSession() {
        // Playback lets the restaurant hear alerts even if the device switch is
        // on silent, while ducking/mixing keeps other audio from fully stopping.
        try? AVAudioSession.sharedInstance().setCategory(
            .playback,
            mode: .default,
            options: [.mixWithOthers, .duckOthers]
        )
        try? AVAudioSession.sharedInstance().setActive(true, options: [])
    }

    static func playTestSound() {
        configureAudioSession()
        guard let url = alertSoundURL() else {
            AudioServicesPlaySystemSound(1304)
            return
        }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = 0
            p.prepareToPlay()
            p.play()
            testSoundPlayer = p
        } catch {
            AudioServicesPlaySystemSound(1304)
        }
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
