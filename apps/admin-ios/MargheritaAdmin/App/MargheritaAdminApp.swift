import SwiftUI
import UIKit

@main
struct MargheritaAdminApp: App {
    @StateObject private var container = AppContainer()
    @StateObject private var router = RootRouter()
    @StateObject private var language = LanguageStore()

    init() {
        // Tab bar / nav bar appearance — keep them solid so the
        // off-white background never blends into iOS's translucent default.
        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = UIColor.white
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab

        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = UIColor(red: 0.949, green: 0.922, blue: 0.871, alpha: 1) // offWhite
        nav.titleTextAttributes = [.foregroundColor: UIColor(red: 0.118, green: 0.118, blue: 0.118, alpha: 1)]
        nav.largeTitleTextAttributes = [.foregroundColor: UIColor(red: 0.478, green: 0.122, blue: 0.122, alpha: 1)]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
    }

    var body: some Scene {
        WindowGroup {
            DialogHost {
                RootView()
                    .environmentObject(container)
                    .environmentObject(router)
                    .environmentObject(language)
                    .environment(\.locale, language.locale)
                    .environment(\.layoutDirection, language.layoutDirection)
            }
        }
    }
}
