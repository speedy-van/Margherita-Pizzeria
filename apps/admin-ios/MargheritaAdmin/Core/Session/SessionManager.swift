import Foundation
import Combine

struct SessionUser: Codable, Equatable {
    let id: String
    let email: String
    let role: String
}

enum AuthState: Equatable {
    case unknown
    case signedOut
    case signedIn(SessionUser)
}

enum SessionEvent {
    case signedOutRemotely
}

/// Mirrors Android `SessionManager`: in-memory token, AuthState flow,
/// SessionEvent flow. Read & written from the main actor.
@MainActor
final class SessionManager: ObservableObject {
    // Persistence keys
    private enum Keys {
        static let token = "auth.token"
        static let userId = "auth.user.id"
        static let userEmail = "auth.user.email"
        static let userRole = "auth.user.role"
    }

    @Published private(set) var state: AuthState = .unknown
    private(set) var currentToken: String?

    let events = PassthroughSubject<SessionEvent, Never>()

    init() {
        // Bootstrap from storage synchronously.
        if let token = KeychainStore.get(Keys.token),
           !token.isEmpty,
           let id = UserDefaults.standard.string(forKey: Keys.userId),
           let email = UserDefaults.standard.string(forKey: Keys.userEmail),
           let role = UserDefaults.standard.string(forKey: Keys.userRole) {
            self.currentToken = token
            self.state = .signedIn(SessionUser(id: id, email: email, role: role))
        } else {
            self.state = .signedOut
        }
    }

    func save(token: String, user: SessionUser) {
        currentToken = token
        KeychainStore.set(token, for: Keys.token)
        let ud = UserDefaults.standard
        ud.set(user.id, forKey: Keys.userId)
        ud.set(user.email, forKey: Keys.userEmail)
        ud.set(user.role, forKey: Keys.userRole)
        state = .signedIn(user)
    }

    func clear() {
        currentToken = nil
        KeychainStore.remove(Keys.token)
        let ud = UserDefaults.standard
        ud.removeObject(forKey: Keys.userId)
        ud.removeObject(forKey: Keys.userEmail)
        ud.removeObject(forKey: Keys.userRole)
        state = .signedOut
    }

    /// Called from ApiClient on any 401.
    func handleUnauthorized() {
        guard currentToken != nil else { return }
        clear()
        events.send(.signedOutRemotely)
    }

}
