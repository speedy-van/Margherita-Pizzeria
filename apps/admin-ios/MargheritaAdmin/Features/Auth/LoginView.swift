import SwiftUI

struct LoginView: View {
    @EnvironmentObject var container: AppContainer
    @StateObject private var vm: AuthViewModel
    @State private var showPassword = false
    @State private var showForgot = false
    @FocusState private var focused: Field?

    enum Field { case email, password, baseURL }

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeAuthViewModel())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Space.lg) {
                    VStack(spacing: AppTheme.Space.sm) {
                        Image(systemName: "fork.knife.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(AppTheme.primary)
                        Text("Margherita Admin").font(.title.bold())
                        Text("Sign in to manage orders, bookings and the menu.")
                            .font(.subheadline)
                            .foregroundStyle(AppTheme.onSurfaceMuted)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, AppTheme.Space.xxl)

                    VStack(spacing: AppTheme.Space.md) {
                        labeled("Email") {
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
                        labeled("Password") {
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
                                .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                            }
                            .padding(8)
                            .background(AppTheme.surface)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppTheme.outline))
                        }

                        DisclosureGroup("Server URL") {
                            TextField("https://www.margheritapizza.uk/",
                                      text: $vm.baseURL)
                                .keyboardType(.URL)
                                .textContentType(.URL)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                                .focused($focused, equals: .baseURL)
                                .textFieldStyle(.roundedBorder)
                                .padding(.top, 6)
                            Text("Override for local development. Persisted on this device.")
                                .font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                                .padding(.top, 4)
                        }
                        .font(.subheadline)
                    }

                    if case .failed(let msg) = vm.phase {
                        Label(msg, systemImage: "exclamationmark.triangle.fill")
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
                            Text(vm.phase == .submitting ? "Signing in…" : "Sign in")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity, minHeight: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(AppTheme.primary)
                    .disabled(!vm.canSubmit)

                    Button("Forgot password?") { showForgot = true }
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
            .onAppear {
                vm.onApplyBaseURL = { [weak container] url in
                    container?.rebuildApiClient(with: url)
                }
            }
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
