import SwiftUI
import Combine

/// Cross-screen dialog system mirroring admin-mobile's `useDialog()`. Avoids
/// `alert()` modifier collisions ("chakra violence"): one host, one queue,
/// one tap-debouncer. `presentXxx` always returns the user's response so call
/// sites stay flat.
@MainActor
final class DialogController: ObservableObject {

    enum Tone { case info, success, warning, danger }

    struct Action: Identifiable {
        enum Style { case primary, secondary, destructive }
        let id = UUID()
        let label: String
        let style: Style
        let onPress: () -> Void

        init(label: String, style: Style = .secondary, onPress: @escaping () -> Void = {}) {
            self.label = label; self.style = style; self.onPress = onPress
        }
    }

    struct Request: Identifiable {
        let id = UUID()
        let title: String
        let message: String?
        let tone: Tone
        let actions: [Action]
        let dismissOnBackdrop: Bool
        let onClose: () -> Void
    }

    @Published var current: Request?
    private var queue: [Request] = []
    /// Debounce: ignore taps within 350 ms of the dialog appearing — prevents
    /// the classic double-tap-fires-action-twice bug when alerts fire fast.
    private var openedAt: Date = .distantPast

    // MARK: - High-level helpers (mirror admin-mobile)

    func alert(title: String,
               message: String? = nil,
               tone: Tone = .info,
               okLabel: String = "OK",
               onClose: @escaping () -> Void = {}) {
        present(Request(
            title: title,
            message: message,
            tone: tone,
            actions: [Action(label: okLabel, style: .primary)],
            dismissOnBackdrop: true,
            onClose: onClose
        ))
    }

    func confirm(title: String,
                 message: String? = nil,
                 confirmLabel: String = "Confirm",
                 cancelLabel: String = "Cancel",
                 destructive: Bool = false,
                 onResult: @escaping (Bool) -> Void) {
        present(Request(
            title: title,
            message: message,
            tone: destructive ? .danger : .info,
            actions: [
                Action(label: cancelLabel, style: .secondary, onPress: { onResult(false) }),
                Action(label: confirmLabel, style: destructive ? .destructive : .primary,
                       onPress: { onResult(true) }),
            ],
            dismissOnBackdrop: true,
            onClose: {}
        ))
    }

    func show(title: String,
              message: String? = nil,
              tone: Tone = .info,
              actions: [Action],
              dismissOnBackdrop: Bool = true,
              onClose: @escaping () -> Void = {}) {
        present(Request(title: title, message: message, tone: tone,
                        actions: actions, dismissOnBackdrop: dismissOnBackdrop,
                        onClose: onClose))
    }

    // MARK: - Internal

    private func present(_ req: Request) {
        if current == nil {
            current = req
            openedAt = Date()
        } else {
            queue.append(req)
        }
    }

    func triggerAction(_ action: Action) {
        // Tap debounce: ignore taps that occur < 350 ms after open.
        guard Date().timeIntervalSince(openedAt) > 0.35 else { return }
        let closing = current
        current = nil
        action.onPress()
        closing?.onClose()
        showNext()
    }

    func backdropTapped() {
        guard let req = current, req.dismissOnBackdrop else { return }
        guard Date().timeIntervalSince(openedAt) > 0.35 else { return }
        current = nil
        req.onClose()
        showNext()
    }

    private func showNext() {
        guard !queue.isEmpty else { return }
        let next = queue.removeFirst()
        // Tiny delay so the dismiss animation completes cleanly.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { [weak self] in
            guard let self else { return }
            self.current = next
            self.openedAt = Date()
        }
    }
}

// MARK: - Host view

struct DialogHost<Content: View>: View {
    @StateObject private var controller = DialogController()
    @ViewBuilder var content: () -> Content

    var body: some View {
        ZStack {
            content()
                .environmentObject(controller)
            if let req = controller.current {
                DialogOverlay(request: req, controller: controller)
                    .transition(.opacity)
                    .zIndex(1000)
            }
        }
        .animation(.easeInOut(duration: 0.18), value: controller.current?.id)
    }
}

private struct DialogOverlay: View {
    let request: DialogController.Request
    @ObservedObject var controller: DialogController
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.45)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture { controller.backdropTapped() }
            VStack(alignment: .leading, spacing: AppTheme.Space.md) {
                HStack(spacing: AppTheme.Space.sm) {
                    Image(systemName: iconName(for: request.tone))
                        .foregroundStyle(color(for: request.tone))
                    Text(request.title).font(.headline)
                }
                if let m = request.message, !m.isEmpty {
                    Text(m).font(.subheadline).foregroundStyle(AppTheme.onSurfaceMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                HStack(spacing: AppTheme.Space.sm) {
                    Spacer()
                    ForEach(request.actions) { action in
                        Button(action.label) { controller.triggerAction(action) }
                            .buttonStyle(.borderedProminent)
                            .tint(buttonTint(action.style))
                            .foregroundStyle(buttonForeground(action.style))
                    }
                }
            }
            .padding(AppTheme.Space.lg)
            .frame(maxWidth: 420)
            .background(AppTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.lg))
            .shadow(color: .black.opacity(0.25), radius: 24, x: 0, y: 12)
            .padding(AppTheme.Space.xl)
            .scaleEffect(appeared ? 1 : 0.92)
            .opacity(appeared ? 1 : 0)
            .onAppear {
                withAnimation(.spring(response: 0.32, dampingFraction: 0.78)) { appeared = true }
            }
        }
    }

    private func iconName(for tone: DialogController.Tone) -> String {
        switch tone {
        case .info:    return "info.circle.fill"
        case .success: return "checkmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .danger:  return "xmark.octagon.fill"
        }
    }
    private func color(for tone: DialogController.Tone) -> Color {
        switch tone {
        case .info:    return AppTheme.info
        case .success: return AppTheme.success
        case .warning: return AppTheme.warning
        case .danger:  return AppTheme.danger
        }
    }
    private func buttonTint(_ s: DialogController.Action.Style) -> Color {
        switch s {
        case .primary:     return AppTheme.primary
        case .secondary:   return Color.gray.opacity(0.25)
        case .destructive: return AppTheme.danger
        }
    }
    private func buttonForeground(_ s: DialogController.Action.Style) -> Color {
        switch s {
        case .primary, .destructive: return .white
        case .secondary:             return AppTheme.onSurface
        }
    }
}
