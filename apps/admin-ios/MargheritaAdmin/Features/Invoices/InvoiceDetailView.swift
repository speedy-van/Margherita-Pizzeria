import SwiftUI
import MessageUI
import UIKit

struct InvoiceDetailView: View {
    @EnvironmentObject var language: LanguageStore
    @StateObject private var vm: InvoiceDetailViewModel

    @State private var showMailCompose  = false
    @State private var showMailAlert    = false

    init(container: AppContainer, orderId: String) {
        _vm = StateObject(wrappedValue: container.makeInvoiceDetailViewModel(orderId: orderId))
    }

    var body: some View {
        Group {
            if case .loading = vm.phase, vm.detail == nil {
                LoadingState()
            } else if case .failed(let m) = vm.phase, vm.detail == nil {
                ErrorState(message: m) { Task { await vm.load() } }
            } else if let detail = vm.detail {
                ScrollView {
                    invoiceCard(detail: detail)
                        .padding(AppTheme.Space.lg)
                }
                .background(AppTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle(
            vm.detail.map { InvoiceDocument(order: $0).invoiceNumber }
                ?? language.text("Invoice")
        )
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbar }
        .task { await vm.load() }
        .sheet(isPresented: $showMailCompose) {
            if let data = vm.pdfData, let detail = vm.detail {
                let doc = InvoiceDocument(order: detail)
                MailComposeView(
                    toAddress:  vm.emailTo,
                    subject:    "Invoice \(doc.invoiceNumber) – Margherita Pizza",
                    body:       emailBody(doc),
                    attachData: data,
                    attachName: "\(doc.invoiceNumber).pdf"
                )
            }
        }
        .alert("Mail not available", isPresented: $showMailAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("No mail account is configured on this device. Please set up Mail in iOS Settings.")
        }
    }

    // MARK: – Toolbar

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItemGroup(placement: .topBarTrailing) {
            Button { sharePDF() } label: {
                Label(language.text("Share PDF"), systemImage: "square.and.arrow.up")
                    .labelStyle(.iconOnly)
            }
            .disabled(vm.pdfData == nil)

            Button { openEmail() } label: {
                Label(language.text("Send Invoice"), systemImage: "envelope")
                    .labelStyle(.iconOnly)
            }
            .disabled(vm.pdfData == nil)
        }
    }

    // MARK: – Invoice card (mirrors PDF layout)

    @ViewBuilder private func invoiceCard(detail: AdminOrderDetail) -> some View {
        let doc = InvoiceDocument(order: detail)
        VStack(alignment: .leading, spacing: 0) {

            // ── Header ──
            invoiceHeader(doc: doc)
            Divider()
                .overlay(AppTheme.primary)
                .padding(.vertical, AppTheme.Space.md)

            // ── Meta ──
            invoiceMeta(doc: doc)
            Divider().padding(.vertical, AppTheme.Space.md)

            // ── Bill To ──
            billToSection(doc: doc)
            Divider().padding(.vertical, AppTheme.Space.md)

            // ── Items ──
            itemsTable(detail: detail)
            Divider().padding(.vertical, AppTheme.Space.md)

            // ── Totals ──
            totalsSection(detail: detail)

            // ── Payment ──
            if let pay = doc.paymentMethod {
                Divider().padding(.vertical, AppTheme.Space.md)
                kv("Payment", pay)
            }

            // ── Footer ──
            Divider()
                .padding(.top, AppTheme.Space.xl)
                .padding(.bottom, AppTheme.Space.lg)
            invoiceFooter()
        }
        .padding(AppTheme.Space.xl)
        .background(AppTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.Radius.md, style: .continuous)
                .stroke(AppTheme.outline, lineWidth: 1)
        )
    }

    @ViewBuilder private func invoiceHeader(doc: InvoiceDocument) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Image("BrandLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(height: 44)
                Text("Margherita Pizza")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(AppTheme.primary)
                Text("www.margheritapizza.uk")
                    .font(.caption2)
                    .foregroundStyle(AppTheme.onSurfaceMuted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("INVOICE")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(AppTheme.primary)
                Text(doc.invoiceNumber)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AppTheme.onSurface)
            }
        }
    }

    @ViewBuilder private func invoiceMeta(doc: InvoiceDocument) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            kv("Date",      doc.issuedDate)
            kv("Reference", doc.reference)
            kv("Type",      doc.orderType)
        }
    }

    @ViewBuilder private func billToSection(doc: InvoiceDocument) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("BILL TO")
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(AppTheme.onSurfaceMuted)
                .kerning(1.5)
            Text(doc.customerName)
                .font(.subheadline.weight(.semibold))
            if let email = doc.customerEmail {
                Text(email).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
            if let phone = doc.customerPhone {
                Text(phone).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
            if let addr = doc.deliveryAddress {
                Text(addr).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
            }
        }
    }

    @ViewBuilder private func itemsTable(detail: AdminOrderDetail) -> some View {
        VStack(spacing: 0) {
            // Column headers
            HStack(spacing: 0) {
                Text("Description")
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("Qty")
                    .frame(width: 32, alignment: .center)
                Text("Unit")
                    .frame(width: 64, alignment: .trailing)
                Text("Total")
                    .frame(width: 72, alignment: .trailing)
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(AppTheme.onSurfaceMuted)
            .padding(.vertical, 6)
            .padding(.horizontal, 8)
            .background(AppTheme.background)
            .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))

            // Rows
            ForEach(Array(detail.items.enumerated()), id: \.offset) { _, item in
                VStack(spacing: 0) {
                    HStack(alignment: .top, spacing: 0) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name).font(.subheadline)
                            if let n = item.notes, !n.isEmpty {
                                Text(n).font(.caption).foregroundStyle(AppTheme.onSurfaceMuted)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(item.quantity)")
                            .font(.subheadline)
                            .frame(width: 32, alignment: .center)
                        Text(Format.pence(item.pricePence))
                            .font(.subheadline)
                            .frame(width: 64, alignment: .trailing)
                        Text(Format.pence(item.pricePence * item.quantity))
                            .font(.subheadline.weight(.semibold))
                            .frame(width: 72, alignment: .trailing)
                    }
                    .padding(.vertical, 8)
                    Divider()
                }
            }
        }
    }

    @ViewBuilder private func totalsSection(detail: AdminOrderDetail) -> some View {
        HStack {
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                totalLine("Subtotal", Format.pence(detail.subtotalPence), bold: false)
                if detail.deliveryFeePence > 0 {
                    totalLine("Delivery", Format.pence(detail.deliveryFeePence), bold: false)
                }
                if detail.discountPence > 0 {
                    let lbl = "Discount" + (detail.discountCode.map { " (\($0))" } ?? "")
                    totalLine(lbl, "−" + Format.pence(detail.discountPence), bold: false)
                }
                Divider().frame(width: 220)
                totalLine("TOTAL", Format.pence(detail.totalPence), bold: true)
            }
        }
    }

    @ViewBuilder private func invoiceFooter() -> some View {
        VStack(spacing: 4) {
            Text("Thank you for your order!")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AppTheme.primary)
            Text("www.margheritapizza.uk")
                .font(.caption)
                .foregroundStyle(AppTheme.onSurfaceMuted)
        }
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }

    // MARK: – Row helpers

    @ViewBuilder private func kv(_ key: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(key)
                .font(.caption)
                .foregroundStyle(AppTheme.onSurfaceMuted)
                .frame(width: 80, alignment: .leading)
            Text(value)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder private func totalLine(_ label: String, _ value: String, bold: Bool) -> some View {
        HStack(spacing: 16) {
            Text(label)
                .font(bold ? .subheadline.weight(.bold) : .caption)
                .foregroundStyle(bold ? AppTheme.onSurface : AppTheme.onSurfaceMuted)
            Text(value)
                .font(bold ? .headline : .subheadline)
                .foregroundStyle(bold ? AppTheme.primary : AppTheme.onSurface)
        }
    }

    // MARK: – Actions

    private func openEmail() {
        vm.emailTo = vm.detail?.customerEmail ?? ""
        if MFMailComposeViewController.canSendMail() {
            showMailCompose = true
        } else {
            showMailAlert = true
        }
    }

    private func sharePDF() {
        guard let data = vm.pdfData, let detail = vm.detail else { return }
        let doc      = InvoiceDocument(order: detail)
        let fileName = "\(doc.invoiceNumber).pdf"
        let url      = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        guard (try? data.write(to: url)) != nil else { return }

        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        guard
            let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let root  = scene.windows.first?.rootViewController
        else { return }

        // iPad popover anchor
        av.popoverPresentationController?.sourceView = root.view
        av.popoverPresentationController?.sourceRect = CGRect(
            x: root.view.bounds.midX, y: 80, width: 1, height: 1
        )
        root.present(av, animated: true)
    }

    private func emailBody(_ doc: InvoiceDocument) -> String {
        """
        Dear \(doc.customerName),

        Please find your invoice attached for order \(doc.reference) placed on \(doc.issuedDate).

        Order Total: \(Format.pence(doc.order.totalPence))

        Thank you for choosing Margherita Pizza!

        Kind regards,
        Margherita Pizza Team
        www.margheritapizza.uk
        """
    }
}
