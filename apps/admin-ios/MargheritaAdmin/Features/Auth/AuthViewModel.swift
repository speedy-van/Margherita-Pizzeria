import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    enum Phase: Equatable { case idle, submitting, failed(String) }
    @Published var email: String = ""
    @Published var password: String = ""
    @Published var phase: Phase = .idle

    private let repo: AuthRepository
    init(repo: AuthRepository, session: SessionManager) {
        self.repo = repo
        _ = session
    }

    var canSubmit: Bool {
        if case .submitting = phase { return false }
        return email.contains("@") && password.count >= 4
    }

    func submit() async {
        guard canSubmit else { return }
        phase = .submitting
        let result = await repo.signIn(email: email.trimmingCharacters(in: .whitespaces),
                                       password: password)
        switch result {
        case .success: phase = .idle
        case .failure(let e): phase = .failed(e.displayMessage)
        }
    }
}

@MainActor
final class ForgotPasswordViewModel: ObservableObject {
    enum Phase: Equatable { case idle, submitting, sent(String), failed(String) }
    @Published var email: String = ""
    @Published var phase: Phase = .idle

    private let repo: AuthRepository
    init(repo: AuthRepository) { self.repo = repo }

    var canSubmit: Bool {
        if case .submitting = phase { return false }
        return email.contains("@")
    }

    func submit() async {
        guard canSubmit else { return }
        phase = .submitting
        let r = await repo.forgotPassword(email: email.trimmingCharacters(in: .whitespaces))
        switch r {
        case .success(let res):
            phase = .sent(res.message ?? "If that email is registered, a reset link is on its way.")
        case .failure(let e):
            phase = .failed(e.displayMessage)
        }
    }
}
