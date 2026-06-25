import Foundation

struct InvoiceDocument {
    let order: AdminOrderDetail

    var invoiceNumber: String {
        "INV-\(order.reference ?? String(order.id.prefix(8)).uppercased())"
    }

    var customerName: String { order.customerName ?? "Guest" }
    var customerEmail: String? { order.customerEmail }
    var customerPhone: String? { order.customerPhone }
    var deliveryAddress: String? { order.type == "delivery" ? order.address : nil }
    var issuedDate: String { Format.date(order.createdAt) }
    var paymentMethod: String? { order.paymentMethod }
    var reference: String { order.reference ?? order.id }
    var orderType: String { order.type.capitalized }
}
