import SwiftUI

struct ForgotPasswordView: View {
    @StateObject private var vm: ForgotPasswordViewModel
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var language: LanguageStore

    init(container: AppContainer) {
        _vm = StateObject(wrappedValue: container.makeForgotPasswordViewModel())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppTheme.Space.lg) {
                Text(language.text("Reset your password"))
                    .font(.title2.bold())
                Text(language.text("We'll email a reset link to the address on file."))
                    .foregroundStyle(AppTheme.onSurfaceMuted)

                TextField("you@example.com", text: $vm.email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .textFieldStyle(.roundedBorder)

                if case .failed(let msg) = vm.phase {
                    Label(language.text(msg), systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(AppTheme.danger)
                        .font(.subheadline)
                }
                if case .sent(let msg) = vm.phase {
                    Label(language.text(msg), systemImage: "checkmark.circle.fill")
                        .foregroundStyle(AppTheme.success)
                        .font(.subheadline)
                }

                Button {
                    Task { await vm.submit() }
                } label: {
                    HStack {
                        if case .submitting = vm.phase { ProgressView().tint(.white) }
                        Text(language.text("Send reset link")).font(.headline)
                    }
                    .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.borderedProminent)
                .tint(AppTheme.primary)
                .disabled(!vm.canSubmit)

                Button(language.text("Back to sign in")) { dismiss() }
                    .foregroundStyle(AppTheme.primary)
                    .padding(.top, AppTheme.Space.sm)
            }
            .padding(AppTheme.Space.lg)
        }
        .background(AppTheme.background.ignoresSafeArea())
        .navigationTitle(language.text("Forgot password"))
        .navigationBarTitleDisplayMode(.inline)
    }
}
