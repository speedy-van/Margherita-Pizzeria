import SwiftUI

struct LoginView: View {
    @EnvironmentObject var container: AppContainer
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: AuthViewModel
    @State private var showPassword = false
    @State private var showForgot = false
    @FocusState private var focused: Field?

    enum Field { case email, password }

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeAuthViewModel())
    }

    var body: some View {
        ScrollView {
            VStack(spacing: AppTheme.Space.lg) {
                VStack(spacing: AppTheme.Space.sm) {
                    Image("BrandLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 96, height: 96)
                        .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous))
                        .accessibilityLabel("Margherita Pizza logo")
                    Text(language.text("app.name")).font(.title.bold())
                    Text(language.text("Manage live orders, bookings and the menu."))
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.onSurfaceMuted)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, AppTheme.Space.xxl)

                VStack(spacing: AppTheme.Space.md) {
                    labeled(language.text("Email")) {
                        TextField("you@example.com", text: $vm.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .focused($focused, equals: .email)
                            .submitLabel(.next)
                            .onSubmit { focused = .password }
                            .textFieldStyle(.roundedBorder)
                    }
                    labeled(language.text("Password")) {
                        HStack {
                            Group {
                                if showPassword {
                                    TextField("••••••••", text: $vm.password)
                                } else {
                                    SecureField("••••••••", text: $vm.password)
                                }
                            }
                            .textContentType(.password)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .focused($focused, equals: .password)
                            .submitLabel(.go)
                            .onSubmit { Task { await vm.submit() } }
                            Button {
                                showPassword.toggle()
                            } label: {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundStyle(AppTheme.onSurfaceMuted)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(showPassword ? language.text("Hide password") : language.text("Show password"))
                        }
                        .padding(8)
                        .background(AppTheme.surface)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppTheme.outline))
                    }

                }

                if case .failed(let msg) = vm.phase {
                    Label(language.text(msg), systemImage: "exclamationmark.triangle.fill")
                        .font(.subheadline)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .foregroundStyle(AppTheme.danger)
                        .background(AppTheme.danger.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                Button {
                    focused = nil
                    Task { await vm.submit() }
                } label: {
                    HStack {
                        if case .submitting = vm.phase {
                            ProgressView().tint(.white)
                        }
                        Text(vm.phase == .submitting ? language.text("Signing in…") : language.text("Sign in"))
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.borderedProminent)
                .tint(AppTheme.primary)
                .disabled(!vm.canSubmit)

                Button(language.text("Forgot password?")) { showForgot = true }
                    .font(.subheadline)
                    .foregroundStyle(AppTheme.primary)

                Spacer(minLength: AppTheme.Space.xl)
            }
            .padding(AppTheme.Space.lg)
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationDestination(isPresented: $showForgot) {
            ForgotPasswordView(container: container)
        }
    }

    @ViewBuilder
    private func labeled<C: View>(_ title: String, @ViewBuilder _ c: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption.weight(.semibold)).foregroundStyle(AppTheme.onSurfaceMuted)
            c()
        }
    }
}
