package uk.margheritapizzeria.admin.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.Logout
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Restaurant
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.auth.ui.AuthViewModel
import uk.margheritapizzeria.admin.auth.ui.ForgotPasswordScreen
import uk.margheritapizzeria.admin.auth.ui.ForgotPasswordViewModel
import uk.margheritapizzeria.admin.auth.ui.LoginScreen
import uk.margheritapizzeria.admin.bookings.ui.BookingDetailScreen
import uk.margheritapizzeria.admin.bookings.ui.BookingDetailViewModel
import uk.margheritapizzeria.admin.bookings.ui.BookingsScreen
import uk.margheritapizzeria.admin.bookings.ui.BookingsViewModel
import uk.margheritapizzeria.admin.core.AppContainer
import uk.margheritapizzeria.admin.core.session.AuthState
import uk.margheritapizzeria.admin.core.session.SessionEvent
import uk.margheritapizzeria.admin.dashboard.ui.DashboardScreen
import uk.margheritapizzeria.admin.dashboard.ui.DashboardViewModel
import uk.margheritapizzeria.admin.discounts.ui.DiscountsScreen
import uk.margheritapizzeria.admin.discounts.ui.DiscountsViewModel
import uk.margheritapizzeria.admin.images.ui.ImagesScreen
import uk.margheritapizzeria.admin.images.ui.ImagesViewModel
import uk.margheritapizzeria.admin.menu.ui.MenuScreen
import uk.margheritapizzeria.admin.menu.ui.MenuViewModel
import uk.margheritapizzeria.admin.orders.ui.OrderDetailScreen
import uk.margheritapizzeria.admin.orders.ui.OrderDetailViewModel
import uk.margheritapizzeria.admin.orders.ui.OrdersScreen
import uk.margheritapizzeria.admin.orders.ui.OrdersViewModel
import uk.margheritapizzeria.admin.settings.ui.SettingsScreen
import uk.margheritapizzeria.admin.settings.ui.SettingsViewModel

private object Routes {
    const val LOGIN = "login"
    const val FORGOT_PASSWORD = "forgot-password"
    const val DASHBOARD = "dashboard"
    const val ORDERS = "orders"
    const val ORDER_DETAIL = "orders/{id}"
    const val BOOKINGS = "bookings"
    const val BOOKING_DETAIL = "bookings/{id}"
    const val MENU = "menu"
    const val MORE = "more"
    const val SETTINGS = "settings"
    const val IMAGES = "images"
    const val DISCOUNTS = "discounts"
}

private enum class Tab(val route: String, val label: String, val icon: ImageVector) {
    Dashboard(Routes.DASHBOARD, "Home", Icons.Outlined.Dashboard),
    Orders(Routes.ORDERS, "Orders", Icons.Outlined.Receipt),
    Bookings(Routes.BOOKINGS, "Bookings", Icons.Outlined.CalendarMonth),
    Menu(Routes.MENU, "Menu", Icons.Outlined.Restaurant),
    More(Routes.MORE, "More", Icons.Outlined.MoreHoriz),
}

private val MORE_ROUTES = setOf(Routes.MORE, Routes.SETTINGS, Routes.IMAGES, Routes.DISCOUNTS)

@Composable
fun AppNavGraph(container: AppContainer) {
    val authState by container.sessionManager.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(container.sessionManager) {
        container.sessionManager.events.collect { event ->
            when (event) {
                SessionEvent.SignedOutRemotely ->
                    snackbarHostState.showSnackbar("Signed out. Please log in again.")
            }
        }
    }

    when (authState) {
        AuthState.Unknown -> SplashScreen()
        AuthState.SignedOut -> SignedOutHost(container)
        is AuthState.SignedIn -> MainShell(container, snackbarHostState)
    }
}

@Composable
private fun SignedOutHost(container: AppContainer) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN) {
            val authViewModel: AuthViewModel = viewModel(
                factory = AuthViewModel.Factory(container.authRepository),
            )
            LoginScreen(
                viewModel = authViewModel,
                onSuccess = { /* session flips state */ },
                onForgotPassword = { navController.navigate(Routes.FORGOT_PASSWORD) },
            )
        }
        composable(Routes.FORGOT_PASSWORD) {
            val vm: ForgotPasswordViewModel = viewModel(
                factory = ForgotPasswordViewModel.Factory(container.authRepository),
            )
            ForgotPasswordScreen(viewModel = vm, onBack = { navController.popBackStack() })
        }
    }
}

@Composable
private fun SplashScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainShell(container: AppContainer, snackbarHostState: SnackbarHostState) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val activeTab = Tab.entries.firstOrNull { tab ->
        if (tab == Tab.More) currentRoute in MORE_ROUTES
        else currentRoute == tab.route || currentRoute?.startsWith("${tab.route}/") == true
    }
    val scope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(activeTab?.label ?: "Margherita Admin") },
                actions = {
                    IconButton(onClick = {
                        scope.launch { container.authRepository.signOut() }
                    }) {
                        Icon(Icons.Outlined.Logout, contentDescription = "Sign out")
                    }
                },
            )
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = activeTab == tab,
                        onClick = {
                            if (activeTab != tab) {
                                navController.navigate(tab.route) {
                                    popUpTo(Routes.DASHBOARD) { inclusive = false; saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = null) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding)) {
            AppNavHost(navController, container)
        }
    }
}

@Composable
private fun AppNavHost(navController: NavHostController, container: AppContainer) {
    NavHost(navController = navController, startDestination = Routes.DASHBOARD) {
        dashboardGraph(navController, container)
        ordersGraph(navController, container)
        bookingsGraph(navController, container)
        menuGraph(container)
        moreGraph(navController, container)
    }
}

private fun NavGraphBuilder.moreGraph(navController: NavHostController, container: AppContainer) {
    composable(Routes.MORE) { MoreMenuScreen(navController) }
    composable(Routes.SETTINGS) {
        val vm: SettingsViewModel = viewModel(
            factory = SettingsViewModel.Factory(container.settingsRepository),
        )
        SettingsScreen(viewModel = vm)
    }
    composable(Routes.IMAGES) {
        val vm: ImagesViewModel = viewModel(
            factory = ImagesViewModel.Factory(container.imagesRepository),
        )
        ImagesScreen(viewModel = vm)
    }
    composable(Routes.DISCOUNTS) {
        val vm: DiscountsViewModel = viewModel(
            factory = DiscountsViewModel.Factory(container.discountsRepository),
        )
        DiscountsScreen(viewModel = vm)
    }
}

@Composable
private fun MoreMenuScreen(navController: NavHostController) {
    val items = listOf(
        Triple(Routes.SETTINGS, "Settings", Icons.Outlined.Settings),
        Triple(Routes.IMAGES, "Images", Icons.Outlined.Image),
        Triple(Routes.DISCOUNTS, "Discounts", Icons.Outlined.LocalOffer),
    )
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items.forEach { (route, label, icon) ->
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.surfaceVariant,
                    onClick = { navController.navigate(route) },
                ) {
                    androidx.compose.foundation.layout.Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(icon, contentDescription = null)
                        Spacer(Modifier.height(0.dp))
                        androidx.compose.foundation.layout.Spacer(
                            modifier = Modifier.padding(horizontal = 8.dp),
                        )
                        Text(label, style = androidx.compose.material3.MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}

private fun NavGraphBuilder.dashboardGraph(navController: NavHostController, container: AppContainer) {
    composable(Routes.DASHBOARD) {
        val vm: DashboardViewModel = viewModel(
            factory = DashboardViewModel.Factory(container.dashboardRepository),
        )
        DashboardScreen(
            viewModel = vm,
            onOpenOrder = { id -> navController.navigate("orders/$id") },
            onOpenBooking = { id -> navController.navigate("bookings/$id") },
        )
    }
}

private fun NavGraphBuilder.ordersGraph(navController: NavHostController, container: AppContainer) {
    composable(Routes.ORDERS) {
        val vm: OrdersViewModel = viewModel(
            factory = OrdersViewModel.Factory(container.ordersRepository),
        )
        OrdersScreen(viewModel = vm, onOpenOrder = { id -> navController.navigate("orders/$id") })
    }
    composable(
        route = Routes.ORDER_DETAIL,
        arguments = listOf(navArgument("id") { type = NavType.StringType }),
    ) { entry ->
        val id = entry.arguments?.getString("id").orEmpty()
        val vm: OrderDetailViewModel = viewModel(
            key = "order-$id",
            factory = OrderDetailViewModel.Factory(container.ordersRepository, id),
        )
        OrderDetailScreen(viewModel = vm)
    }
}

private fun NavGraphBuilder.bookingsGraph(navController: NavHostController, container: AppContainer) {
    composable(Routes.BOOKINGS) {
        val vm: BookingsViewModel = viewModel(
            factory = BookingsViewModel.Factory(container.bookingsRepository),
        )
        BookingsScreen(viewModel = vm, onOpenBooking = { id -> navController.navigate("bookings/$id") })
    }
    composable(
        route = Routes.BOOKING_DETAIL,
        arguments = listOf(navArgument("id") { type = NavType.StringType }),
    ) { entry ->
        val id = entry.arguments?.getString("id").orEmpty()
        val vm: BookingDetailViewModel = viewModel(
            key = "booking-$id",
            factory = BookingDetailViewModel.Factory(container.bookingsRepository, id),
        )
        BookingDetailScreen(viewModel = vm)
    }
}

private fun NavGraphBuilder.menuGraph(container: AppContainer) {
    composable(Routes.MENU) {
        val vm: MenuViewModel = viewModel(
            factory = MenuViewModel.Factory(container.menuRepository),
        )
        MenuScreen(viewModel = vm)
    }
}
