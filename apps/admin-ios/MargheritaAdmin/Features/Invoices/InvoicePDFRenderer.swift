import UIKit

enum InvoicePDFRenderer {

    // MARK: – Page geometry
    private static let pageW:  CGFloat = 595   // A4 at 72 dpi
    private static let pageH:  CGFloat = 842
    private static let mg:     CGFloat = 50    // margin
    private static var cW:     CGFloat { pageW - 2 * mg }  // content width

    // MARK: – Brand palette (mirrors AppTheme)
    private static let red   = UIColor(red: 0.478, green: 0.122, blue: 0.122, alpha: 1)
    private static let dark  = UIColor(red: 0.118, green: 0.118, blue: 0.118, alpha: 1)
    private static let muted = UIColor(red: 0.45,  green: 0.45,  blue: 0.45,  alpha: 1)
    private static let lGray = UIColor(red: 0.88,  green: 0.88,  blue: 0.88,  alpha: 1)

    // MARK: – Entry point

    static func render(_ doc: InvoiceDocument) -> Data {
        let bounds = CGRect(x: 0, y: 0, width: pageW, height: pageH)
        let renderer = UIGraphicsPDFRenderer(bounds: bounds)
        return renderer.pdfData { ctx in
            ctx.beginPage()
            var y: CGFloat = mg

            y = drawHeader(doc: doc, y: y)
            y += 8;  hline(y: y, color: red);  y += 2 + 12
            y = drawMeta(doc: doc, y: y)
            y += 10; hline(y: y, color: lGray); y += 2 + 10
            y = drawBillTo(doc: doc, y: y)
            y += 10; hline(y: y, color: lGray); y += 2 + 10
            y = drawItems(doc: doc, y: y)
            hline(y: y, color: lGray); y += 2 + 10
            y = drawTotals(doc: doc, y: y)

            if let pay = doc.paymentMethod {
                y += 8; hline(y: y, color: lGray); y += 2 + 10
                txt("Payment Method:", at: CGPoint(x: mg, y: y), size: 10, color: muted)
                txt(pay, at: CGPoint(x: mg + 130, y: y), size: 10, color: dark)
            }

            drawFooter()
        }
    }

    // MARK: – Header

    @discardableResult
    private static func drawHeader(doc: InvoiceDocument, y: CGFloat) -> CGFloat {
        var logoBottom = y + 4

        // Brand logo — falls back to styled text if asset missing
        if let img = UIImage(named: "BrandLogo") {
            let h: CGFloat = 52
            let w = h * (img.size.width / max(img.size.height, 1))
            img.draw(in: CGRect(x: mg, y: y, width: min(w, 120), height: h))
            logoBottom = y + h
        }

        // Company name & URL
        txt("Margherita Pizza",
            at: CGPoint(x: mg, y: logoBottom + 5),
            size: 11, weight: .bold, color: red)
        txt("www.margheritapizza.uk",
            at: CGPoint(x: mg, y: logoBottom + 20),
            size: 9, color: muted)

        // "INVOICE" – right-aligned
        let invStr = attrStr("INVOICE", size: 28, weight: .bold, color: red)
        let invSz  = invStr.size()
        invStr.draw(at: CGPoint(x: pageW - mg - invSz.width, y: y))

        // Invoice number below
        let numStr = attrStr(doc.invoiceNumber, size: 11, weight: .semibold, color: dark)
        let numSz  = numStr.size()
        numStr.draw(at: CGPoint(x: pageW - mg - numSz.width, y: y + 34))

        return logoBottom + 32
    }

    // MARK: – Invoice meta

    @discardableResult
    private static func drawMeta(doc: InvoiceDocument, y: CGFloat) -> CGFloat {
        var y = y
        kv("Date",            doc.issuedDate,  y: y); y += 16
        kv("Order Reference", doc.reference,   y: y); y += 16
        kv("Type",            doc.orderType,   y: y); y += 16
        return y
    }

    // MARK: – Bill To

    @discardableResult
    private static func drawBillTo(doc: InvoiceDocument, y: CGFloat) -> CGFloat {
        var y = y
        txtKern("BILL TO", at: CGPoint(x: mg, y: y), size: 8, weight: .semibold,
                color: muted, kern: 1.5)
        y += 14
        txt(doc.customerName, at: CGPoint(x: mg, y: y),
            size: 11, weight: .semibold, color: dark); y += 15
        if let email = doc.customerEmail {
            txt(email, at: CGPoint(x: mg, y: y), size: 10, color: muted); y += 14
        }
        if let phone = doc.customerPhone {
            txt(phone, at: CGPoint(x: mg, y: y), size: 10, color: muted); y += 14
        }
        if let addr = doc.deliveryAddress {
            txt(addr, at: CGPoint(x: mg, y: y), size: 10, color: muted); y += 14
        }
        return y
    }

    // MARK: – Items table

    @discardableResult
    private static func drawItems(doc: InvoiceDocument, y: CGFloat) -> CGFloat {
        var y = y

        // Column right-edge X positions (content ends at mg + cW = 545)
        let qtyRX:  CGFloat = mg + 280
        let unitRX: CGFloat = mg + 390
        let totRX:  CGFloat = mg + cW

        // Header background
        lGray.setFill()
        UIBezierPath(roundedRect: CGRect(x: mg - 4, y: y - 3, width: cW + 8, height: 21),
                     cornerRadius: 3).fill()

        txt("Description", at: CGPoint(x: mg, y: y), size: 9, weight: .semibold, color: dark)
        rtxt("Qty",   rx: qtyRX,  y: y, size: 9, weight: .semibold, color: dark)
        rtxt("Unit",  rx: unitRX, y: y, size: 9, weight: .semibold, color: dark)
        rtxt("Total", rx: totRX,  y: y, size: 9, weight: .semibold, color: dark)
        y += 23

        for item in doc.order.items {
            let hasNotes = !(item.notes ?? "").isEmpty
            txt(item.name, at: CGPoint(x: mg, y: y), size: 10, color: dark)
            if hasNotes, let n = item.notes {
                txt(n, at: CGPoint(x: mg, y: y + 12), size: 9, color: muted)
            }
            rtxt("\(item.quantity)",
                 rx: qtyRX,  y: y, size: 10, color: dark)
            rtxt(Format.pence(item.pricePence),
                 rx: unitRX, y: y, size: 10, color: dark)
            rtxt(Format.pence(item.pricePence * item.quantity),
                 rx: totRX,  y: y, size: 10, weight: .semibold, color: dark)

            let rowH: CGFloat = hasNotes ? 30 : 20
            y += rowH

            // Row divider
            UIColor.lightGray.withAlphaComponent(0.35).setStroke()
            let p = UIBezierPath(); p.lineWidth = 0.5
            p.move(to: CGPoint(x: mg, y: y))
            p.addLine(to: CGPoint(x: mg + cW, y: y))
            p.stroke()
            y += 5
        }
        return y + 4
    }

    // MARK: – Totals

    @discardableResult
    private static func drawTotals(doc: InvoiceDocument, y: CGFloat) -> CGFloat {
        var y = y
        let lx: CGFloat = pageW - mg - 210
        let vx: CGFloat = pageW - mg

        totRow("Subtotal:", Format.pence(doc.order.subtotalPence),
               lx: lx, vx: vx, y: y, big: false); y += 18

        if doc.order.deliveryFeePence > 0 {
            totRow("Delivery:", Format.pence(doc.order.deliveryFeePence),
                   lx: lx, vx: vx, y: y, big: false); y += 18
        }
        if doc.order.discountPence > 0 {
            let lbl = "Discount" + (doc.order.discountCode.map { " (\($0)):" } ?? ":")
            totRow(lbl, "−\(Format.pence(doc.order.discountPence))",
                   lx: lx, vx: vx, y: y, big: false); y += 18
        }

        hline(y: y, x0: lx - 4, color: lGray); y += 8
        totRow("TOTAL:", Format.pence(doc.order.totalPence),
               lx: lx, vx: vx, y: y, big: true); y += 22
        return y
    }

    // MARK: – Footer

    private static func drawFooter() {
        let y: CGFloat = pageH - 52
        hline(y: y - 8, color: lGray)

        let msg    = attrStr("Thank you for your order!", size: 10, weight: .semibold, color: red)
        let msgSz  = msg.size()
        msg.draw(at: CGPoint(x: (pageW - msgSz.width) / 2, y: y))

        let web   = attrStr("www.margheritapizza.uk", size: 9, color: muted)
        let webSz = web.size()
        web.draw(at: CGPoint(x: (pageW - webSz.width) / 2, y: y + 14))
    }

    // MARK: – Drawing helpers

    private static func txt(_ s: String, at pt: CGPoint,
                             size: CGFloat, weight: UIFont.Weight = .regular,
                             color: UIColor) {
        attrStr(s, size: size, weight: weight, color: color).draw(at: pt)
    }

    private static func txtKern(_ s: String, at pt: CGPoint,
                                 size: CGFloat, weight: UIFont.Weight = .regular,
                                 color: UIColor, kern: CGFloat) {
        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .kern: kern
        ]
        NSAttributedString(string: s, attributes: attrs).draw(at: pt)
    }

    private static func rtxt(_ s: String, rx: CGFloat, y: CGFloat,
                              size: CGFloat, weight: UIFont.Weight = .regular,
                              color: UIColor) {
        let str = attrStr(s, size: size, weight: weight, color: color)
        str.draw(at: CGPoint(x: rx - str.size().width, y: y))
    }

    private static func kv(_ key: String, _ val: String, y: CGFloat) {
        txt(key + ":", at: CGPoint(x: mg,        y: y), size: 10, color: muted)
        txt(val,       at: CGPoint(x: mg + 130,  y: y), size: 10, weight: .medium, color: dark)
    }

    private static func totRow(_ label: String, _ value: String,
                                 lx: CGFloat, vx: CGFloat, y: CGFloat, big: Bool) {
        let lFont = UIFont.systemFont(ofSize: big ? 11 : 10, weight: big ? .bold : .regular)
        let vFont = UIFont.systemFont(ofSize: big ? 13 : 10, weight: big ? .bold : .regular)
        NSAttributedString(string: label,
                           attributes: [.font: lFont,
                                        .foregroundColor: big ? dark : muted])
            .draw(at: CGPoint(x: lx, y: y))
        let vStr = NSAttributedString(string: value,
                                      attributes: [.font: vFont,
                                                   .foregroundColor: big ? red : dark])
        vStr.draw(at: CGPoint(x: vx - vStr.size().width, y: y))
    }

    private static func hline(y: CGFloat, x0: CGFloat? = nil, color: UIColor) {
        color.setStroke()
        let p = UIBezierPath(); p.lineWidth = 0.75
        p.move(to:    CGPoint(x: x0 ?? mg,  y: y))
        p.addLine(to: CGPoint(x: mg + cW,   y: y))
        p.stroke()
    }

    private static func attrStr(_ s: String, size: CGFloat,
                                  weight: UIFont.Weight = .regular,
                                  color: UIColor) -> NSAttributedString {
        NSAttributedString(string: s, attributes: [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color
        ])
    }
}
