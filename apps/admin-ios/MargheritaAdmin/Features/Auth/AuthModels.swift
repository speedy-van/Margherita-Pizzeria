import Foundation

struct LoginUser: Codable, Equatable {
    let id: String
    let email: String
    let role: String
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct LoginResponse: Decodable {
    let token: String
    let expiresAt: String?
    let user: LoginUser
}

struct MeResponse: Decodable {
    let user: LoginUser
}

struct ForgotPasswordRequest: Encodable {
    let email: String
}

struct ForgotPasswordResponse: Decodable {
    let message: String?
}
