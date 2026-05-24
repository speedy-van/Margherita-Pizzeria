import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var router: RootRouter
    @EnvironmentObject var dialog: DialogController

    @StateObject private var badges: BadgesController

    init(container: AppContainer, router: RootRouter) {
        _badges = StateObject(wrappedValue: container.makeBadgesController(router: router))
    }

    var body: some View {
        TabView(selection: $router.selectedTab) {
            tab(.dashboard, path: $router.dashboardPath) {
                DashboardView(container: container)
            }

            tab(.orders, path: $router.ordersPath, badge: badges.pendingOrders) {
                OrdersListView(container: container)
            }

            tab(.bookings, path: $router.bookingsPath, badge: badges.pendingBookings) {
                BookingsListView(container: container)
            }

            tab(.menu, path: $router.menuPath) {
                MenuView(container: container)
            }

            tab(.more, path: $router.morePath) {
                MoreView()
            }
        }
        .tint(AppTheme.primary)
        .onAppear {
            badges.attach(dialog: dialog)
            badges.start()
            BadgesController.requestNotificationPermission()
        }
        .onDisappear { badges.stop() }
    }

    @ViewBuilder
    private func tab<Content: View>(
        _ tab: AppTab,
        path: Binding<[Route]>,
        badge: Int = 0,
        @ViewBuilder _ content: () -> Content
    ) -> some View {
        NavigationStack(path: path) {
            content()
        }
        .tabItem {
            Label(tab.title, systemImage: tab.systemImage)
        }
        .badge(badge > 0 ? badge : 0)
        .tag(tab)
    }
}
