package uk.margheritapizzeria.admin.core

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import retrofit2.Retrofit
import retrofit2.create
import uk.margheritapizzeria.admin.auth.data.AuthApi
import uk.margheritapizzeria.admin.auth.data.AuthRepository
import uk.margheritapizzeria.admin.bookings.data.BookingsApi
import uk.margheritapizzeria.admin.bookings.data.BookingsRepository
import uk.margheritapizzeria.admin.core.datastore.SessionStore
import uk.margheritapizzeria.admin.core.network.ApiClient
import uk.margheritapizzeria.admin.core.session.SessionManager
import uk.margheritapizzeria.admin.dashboard.data.DashboardApi
import uk.margheritapizzeria.admin.dashboard.data.DashboardRepository
import uk.margheritapizzeria.admin.discounts.data.DiscountsApi
import uk.margheritapizzeria.admin.discounts.data.DiscountsRepository
import uk.margheritapizzeria.admin.fcm.DevicesApi
import uk.margheritapizzeria.admin.fcm.DevicesRepository
import uk.margheritapizzeria.admin.images.data.ImagesApi
import uk.margheritapizzeria.admin.images.data.ImagesRepository
import uk.margheritapizzeria.admin.menu.data.MenuAdminApi
import uk.margheritapizzeria.admin.menu.data.MenuRepository
import uk.margheritapizzeria.admin.orders.data.OrdersApi
import uk.margheritapizzeria.admin.orders.data.OrdersRepository
import uk.margheritapizzeria.admin.settings.data.SettingsApi
import uk.margheritapizzeria.admin.settings.data.SettingsRepository

/**
 * Manual DI container. Constructed once in [uk.margheritapizzeria.admin.MargheritaAdminApp].
 * Avoids the weight of Hilt/Koin for a focused single-module admin app.
 */
class AppContainer(context: Context) {

    private val appScope = CoroutineScope(SupervisorJob())

    val sessionStore: SessionStore = SessionStore(context.applicationContext)
    val sessionManager: SessionManager = SessionManager(sessionStore, appScope)

    private val retrofit: Retrofit = ApiClient.build(sessionManager)

    val authRepository: AuthRepository = AuthRepository(
        api = retrofit.create<AuthApi>(),
        sessionManager = sessionManager,
    )
    val dashboardRepository: DashboardRepository =
        DashboardRepository(retrofit.create<DashboardApi>())
    val ordersRepository: OrdersRepository =
        OrdersRepository(retrofit.create<OrdersApi>())
    val bookingsRepository: BookingsRepository =
        BookingsRepository(retrofit.create<BookingsApi>())
    val menuRepository: MenuRepository =
        MenuRepository(retrofit.create<MenuAdminApi>())
    val settingsRepository: SettingsRepository =
        SettingsRepository(retrofit.create<SettingsApi>())
    val imagesRepository: ImagesRepository =
        ImagesRepository(retrofit.create<ImagesApi>())
    val discountsRepository: DiscountsRepository =
        DiscountsRepository(retrofit.create<DiscountsApi>())
    val devicesRepository: DevicesRepository =
        DevicesRepository(retrofit.create<DevicesApi>())
}
