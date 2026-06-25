import Foundation
import Combine

/// Manual DI container — mirrors Android `core/AppContainer.kt`.
/// Stored in the SwiftUI environment so feature view models can resolve
/// their dependencies via factory methods on the container.
@MainActor
final class AppContainer: ObservableObject {

    let session: SessionManager
    @Published private(set) var apiClient: ApiClient
    @Published private(set) var baseURL: URL

    // Repositories (immutable; they hold an ApiClient *closure-capture* indirectly
    // through a small forwarder so swapping the client is transparent).
    let auth: AuthRepository
    let dashboard: DashboardRepository
    let orders: OrdersRepository
    let bookings: BookingsRepository
    let menu: MenuRepository
    let settings: SettingsRepository
    let images: ImagesRepository
    let discounts: DiscountsRepository

    /// Receives session events (e.g. signed-out-remotely) so the UI can react.
    let sessionEvents: PassthroughSubject<SessionEvent, Never>

    init() {
        let session = SessionManager()
        self.session = session
        let initialURL = AppConfig.baseURL
        self.baseURL = initialURL
        let client = ApiClient(baseURL: initialURL, sessionManager: session)
        self.apiClient = client

        self.auth = AuthRepository(api: client, session: session)
        self.dashboard = DashboardRepository(api: client)
        self.orders = OrdersRepository(api: client)
        self.bookings = BookingsRepository(api: client)
        self.menu = MenuRepository(api: client)
        self.settings = SettingsRepository(api: client)
        self.images = ImagesRepository(api: client)
        self.discounts = DiscountsRepository(api: client)

        self.sessionEvents = session.events
    }

    func signOut() async {
        let repo = AuthRepository(api: apiClient, session: session)
        await repo.signOut()
    }

    // MARK: - View-model factories
    // Auth lives at the boundary so we always use the current apiClient.

    func makeAuthViewModel() -> AuthViewModel {
        AuthViewModel(
            repo: AuthRepository(api: apiClient, session: session),
            session: session
        )
    }
    func makeForgotPasswordViewModel() -> ForgotPasswordViewModel {
        ForgotPasswordViewModel(repo: AuthRepository(api: apiClient, session: session))
    }
    func makeDashboardViewModel() -> DashboardViewModel {
        DashboardViewModel(repo: DashboardRepository(api: apiClient))
    }
    func makeOrdersListViewModel() -> OrdersListViewModel {
        OrdersListViewModel(repo: OrdersRepository(api: apiClient))
    }
    func makeOrderDetailViewModel(id: String) -> OrderDetailViewModel {
        OrderDetailViewModel(id: id, repo: OrdersRepository(api: apiClient))
    }
    func makeBookingsListViewModel() -> BookingsListViewModel {
        BookingsListViewModel(repo: BookingsRepository(api: apiClient))
    }
    func makeBookingDetailViewModel(id: String) -> BookingDetailViewModel {
        BookingDetailViewModel(id: id, repo: BookingsRepository(api: apiClient))
    }
    func makeMenuViewModel() -> MenuViewModel {
        MenuViewModel(repo: MenuRepository(api: apiClient))
    }
    func makeSettingsViewModel() -> SettingsViewModel {
        SettingsViewModel(repo: SettingsRepository(api: apiClient))
    }
    func makeImagesViewModel() -> ImagesViewModel {
        ImagesViewModel(repo: ImagesRepository(api: apiClient))
    }
    func makeDiscountsViewModel() -> DiscountsViewModel {
        DiscountsViewModel(repo: DiscountsRepository(api: apiClient))
    }
    func makeInvoicesListViewModel() -> InvoicesListViewModel {
        InvoicesListViewModel(repo: OrdersRepository(api: apiClient))
    }
    func makeInvoiceDetailViewModel(orderId: String) -> InvoiceDetailViewModel {
        InvoiceDetailViewModel(orderId: orderId, repo: OrdersRepository(api: apiClient))
    }
    func makeBadgesController(router: RootRouter) -> BadgesController {
        BadgesController(repo: DashboardRepository(api: apiClient),
                         session: session, router: router)
    }
}
