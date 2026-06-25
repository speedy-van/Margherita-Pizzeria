import SwiftUI
import MessageUI

// UIViewControllerRepresentable wrapper for MFMailComposeViewController.
// The To field is pre-filled but editable — the admin can change the recipient
// before tapping Send, satisfying the "dynamic email" requirement.
struct MailComposeView: UIViewControllerRepresentable {
    let toAddress:  String
    let subject:    String
    let body:       String
    let attachData: Data?
    let attachName: String

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> MFMailComposeViewController {
        let vc = MFMailComposeViewController()
        vc.mailComposeDelegate = context.coordinator
        if !toAddress.isEmpty { vc.setToRecipients([toAddress]) }
        vc.setSubject(subject)
        vc.setMessageBody(body, isHTML: false)
        if let data = attachData {
            vc.addAttachmentData(data, mimeType: "application/pdf", fileName: attachName)
        }
        return vc
    }

    func updateUIViewController(_ uiViewController: MFMailComposeViewController,
                                context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(dismiss: dismiss) }

    final class Coordinator: NSObject, MFMailComposeViewControllerDelegate {
        private let dismiss: DismissAction
        init(dismiss: DismissAction) { self.dismiss = dismiss }

        func mailComposeController(_ controller: MFMailComposeViewController,
                                   didFinishWith result: MFMailComposeResult,
                                   error: Error?) {
            dismiss()
        }
    }
}
