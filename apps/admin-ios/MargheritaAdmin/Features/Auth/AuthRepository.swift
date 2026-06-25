import Foundation

@MainActor
final class AuthRepository {
    private let api: ApiClient
    private let session: SessionManager
    init(api: ApiClient, session: SessionManager) {
        self.api = api; self.session = session
    }

    func signIn(email: String, password: String) async -> ApiResult<LoginUser> {
        if DemoData.isReviewCredential(email: email, password: password) {
            session.save(token: DemoData.token, user: DemoData.sessionUser)
            return .success(DemoData.loginUser)
        }

        let result: ApiResult<LoginResponse> = await api.post(
            "/api/mobile/admin/login",
            body: LoginRequest(email: email, password: password)
        )
        switch result {
        case .success(let res):
            let u = SessionUser(id: res.user.id, email: res.user.email, role: res.user.role)
            session.save(token: res.token, user: u)
            return .success(res.user)
        case .failure(let e): return .failure(e)
        }
    }

    func signOut() async {
        if api.isDemoMode {
            session.clear()
            return
        }
        let _: ApiResult<EmptyResponse> = await api.post("/api/mobile/admin/logout", body: Optional<LoginRequest>.none)
        session.clear()
    }

    func me() async -> ApiResult<LoginUser> {
        if api.isDemoMode {
            return .success(DemoData.loginUser)
        }
        let r: ApiResult<MeResponse> = await api.get("/api/mobile/admin/me")
        return r.map { $0.user }
    }

    func forgotPassword(email: String) async -> ApiResult<ForgotPasswordResponse> {
        await api.post("/api/mobile/admin/auth/forgot-password",
                       body: ForgotPasswordRequest(email: email))
    }
}
