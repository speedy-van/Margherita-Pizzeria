import Foundation

enum DemoData {
    static let token = "demo-review-token"
    static let email = "review@margheritapizza.uk"
    static let password = "AppleReview2026!"

    static let sessionUser = SessionUser(id: "demo-reviewer", email: email, role: "admin")
    static let loginUser = LoginUser(id: "demo-reviewer", email: email, role: "admin")

    private static var orders: [AdminOrderDetail] = [
        AdminOrderDetail(
            id: "demo-order-1001",
            reference: "DEMO-1001",
            type: "delivery",
            status: "received",
            customerName: "Apple Review",
            customerEmail: "reviewer@example.com",
            customerPhone: "+44 7700 900123",
            address: "1 Infinite Loop, Glasgow",
            totalPence: 2498,
            subtotalPence: 2298,
            deliveryFeePence: 200,
            discountPence: 0,
            discountCode: nil,
            paymentMethod: "Card paid",
            items: [
                OrderItemSnapshot(id: "demo-order-1001-1", name: "Margherita (12\")", pricePence: 1100, quantity: 1, notes: nil),
                OrderItemSnapshot(id: "demo-order-1001-2", name: "Chicken Shawarma Wrap", pricePence: 699, quantity: 1, notes: "No chilli"),
                OrderItemSnapshot(id: "demo-order-1001-3", name: "Chips", pricePence: 499, quantity: 1, notes: nil),
            ],
            estimatedTime: "25-35 min",
            createdAt: "2026-06-22T18:20:00Z",
            updatedAt: "2026-06-22T18:25:00Z",
            notes: "Demo order for App Review. Status changes stay on this device only."
        ),
        AdminOrderDetail(
            id: "demo-order-1002",
            reference: "DEMO-1002",
            type: "collection",
            status: "making",
            customerName: "Test Collection",
            customerEmail: "collection@example.com",
            customerPhone: "+44 7700 900456",
            address: nil,
            totalPence: 1799,
            subtotalPence: 1799,
            deliveryFeePence: 0,
            discountPence: 0,
            discountCode: nil,
            paymentMethod: "Cash on collection",
            items: [
                OrderItemSnapshot(id: "demo-order-1002-1", name: "Pepperoni (16\")", pricePence: 1700, quantity: 1, notes: nil),
                OrderItemSnapshot(id: "demo-order-1002-2", name: "Garlic Mayo", pricePence: 99, quantity: 1, notes: nil),
            ],
            estimatedTime: "Ready at 19:00",
            createdAt: "2026-06-22T18:05:00Z",
            updatedAt: "2026-06-22T18:15:00Z",
            notes: nil
        ),
    ]

    private static var bookings: [AdminBookingDetail] = [
        AdminBookingDetail(
            id: "demo-booking-2001",
            reference: "BOOK-2001",
            date: "2026-06-23",
            timeSlot: "19:30",
            covers: 4,
            status: "pending",
            depositPaid: true,
            depositPence: 2000,
            customerName: "Demo Booking",
            customerEmail: "booking@example.com",
            customerPhone: "+44 7700 900789",
            tableId: "Table 4",
            notes: "Window table if possible.",
            createdAt: "2026-06-22T17:00:00Z",
            updatedAt: "2026-06-22T17:00:00Z"
        ),
    ]

    private static var categories: [AdminMenuCategory] = [
        AdminMenuCategory(id: "cat-pizza", name: "Stone Baked Pizzas", displayOrder: 10, active: true, createdAt: nil),
        AdminMenuCategory(id: "cat-sides", name: "Sides", displayOrder: 20, active: true, createdAt: nil),
        AdminMenuCategory(id: "cat-drinks", name: "Drinks", displayOrder: 30, active: true, createdAt: nil),
    ]

    private static var menuItems: [AdminMenuItem] = [
        AdminMenuItem(id: "item-margherita", categoryId: "cat-pizza", name: "Margherita (12\")", description: "Fresh mozzarella, parmesan and basil.", pricePence: 1100, imageUrl: nil, available: true, allergens: ["dairy", "gluten"], createdAt: nil),
        AdminMenuItem(id: "item-pepperoni", categoryId: "cat-pizza", name: "Pepperoni (16\")", description: "Pepperoni, cherry tomato and mozzarella.", pricePence: 1700, imageUrl: nil, available: true, allergens: ["dairy", "gluten"], createdAt: nil),
        AdminMenuItem(id: "item-chips", categoryId: "cat-sides", name: "Chips", description: "Skin-on chips.", pricePence: 399, imageUrl: nil, available: true, allergens: [], createdAt: nil),
        AdminMenuItem(id: "item-coke", categoryId: "cat-drinks", name: "Can - Coke", description: "330ml can.", pricePence: 120, imageUrl: nil, available: false, allergens: [], createdAt: nil),
    ]

    private static var settings = AdminSettings(
        minDeliveryOrderPence: 1000,
        deliveryFeePence: 200,
        prepTimeMinutes: 25,
        deliveryTimeMinutes: 40,
        depositEnabled: true,
        depositAmountPence: 500,
        openingHours: [
            "monday": AdminDaySchedule(open: "11:00", close: "23:00", closed: false),
            "tuesday": AdminDaySchedule(open: "11:00", close: "23:00", closed: false),
            "wednesday": AdminDaySchedule(open: "11:00", close: "23:00", closed: false),
            "thursday": AdminDaySchedule(open: "11:00", close: "23:00", closed: false),
            "friday": AdminDaySchedule(open: "11:00", close: "00:00", closed: false),
            "saturday": AdminDaySchedule(open: "11:00", close: "00:00", closed: false),
            "sunday": AdminDaySchedule(open: "11:00", close: "23:00", closed: false),
        ]
    )

    private static var timeSlots: [AdminTimeSlot] = [
        AdminTimeSlot(id: "slot-collection-1800", type: "collection", time: "18:00", active: true, createdAt: nil),
        AdminTimeSlot(id: "slot-collection-1830", type: "collection", time: "18:30", active: true, createdAt: nil),
        AdminTimeSlot(id: "slot-booking-1930", type: "booking", time: "19:30", active: true, createdAt: nil),
    ]

    private static var tables: [AdminTable] = [
        AdminTable(id: "table-1", number: 1, maxCovers: 2, active: true, createdAt: nil),
        AdminTable(id: "table-4", number: 4, maxCovers: 4, active: true, createdAt: nil),
        AdminTable(id: "table-6", number: 6, maxCovers: 6, active: false, createdAt: nil),
    ]

    private static var images: [AdminImage] = [
        AdminImage(id: "image-hero", label: "Home hero", url: "https://www.margheritapizza.uk/uploads/hero.jpg", section: "Website", updatedAt: nil),
        AdminImage(id: "image-menu", label: "Menu header", url: nil, section: "Menu", updatedAt: nil),
    ]

    private static var discounts: [AdminDiscount] = [
        AdminDiscount(id: "discount-demo10", code: "DEMO10", title: "Demo review discount", description: "Local demo only.", type: "percentage", value: 10, minOrderPence: 1500, startsAt: nil, endsAt: nil, active: false, appliesToDelivery: true, appliesToCollection: true, createdAt: nil, updatedAt: nil),
    ]

    static func isReviewCredential(email rawEmail: String, password rawPassword: String) -> Bool {
        rawEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == email
            && rawPassword == password
    }

    static func dashboard() -> AdminDashboardStats {
        let latestOrders = orderList()
        let latestBookings = bookingList()
        return AdminDashboardStats(
            totalOrders: latestOrders.count,
            totalOrderValuePence: latestOrders.reduce(0) { $0 + $1.totalPence },
            pendingOrders: latestOrders.filter { ["pending_payment", "received", "making"].contains($0.status) }.count,
            totalBookings: latestBookings.count,
            pendingBookings: latestBookings.filter { $0.status == "pending" }.count,
            latestOrders: latestOrders,
            latestBookings: latestBookings,
            revenueTodayPence: latestOrders.reduce(0) { $0 + $1.totalPence }
        )
    }

    static func orderList() -> [AdminOrderListItem] {
        orders.map { detail in
            AdminOrderListItem(
                id: detail.id,
                reference: detail.reference,
                type: detail.type,
                status: detail.status,
                customerName: detail.customerName,
                customerEmail: detail.customerEmail,
                customerPhone: detail.customerPhone,
                totalPence: detail.totalPence,
                paymentMethod: detail.paymentMethod,
                itemCount: detail.items.reduce(0) { $0 + $1.quantity },
                createdAt: detail.createdAt,
                updatedAt: detail.updatedAt
            )
        }
    }

    static func orderDetail(id: String) -> AdminOrderDetail? {
        orders.first { $0.id == id }
    }

    static func updateOrder(id: String, status: String) -> AdminOrderDetail? {
        guard let index = orders.firstIndex(where: { $0.id == id }) else { return nil }
        let existing = orders[index]
        let updated = AdminOrderDetail(
            id: existing.id,
            reference: existing.reference,
            type: existing.type,
            status: status,
            customerName: existing.customerName,
            customerEmail: existing.customerEmail,
            customerPhone: existing.customerPhone,
            address: existing.address,
            totalPence: existing.totalPence,
            subtotalPence: existing.subtotalPence,
            deliveryFeePence: existing.deliveryFeePence,
            discountPence: existing.discountPence,
            discountCode: existing.discountCode,
            paymentMethod: existing.paymentMethod,
            items: existing.items,
            estimatedTime: existing.estimatedTime,
            createdAt: existing.createdAt,
            updatedAt: "2026-06-22T18:30:00Z",
            notes: existing.notes
        )
        orders[index] = updated
        return updated
    }

    static func bookingList() -> [AdminBookingListItem] {
        bookings.map { detail in
            AdminBookingListItem(
                id: detail.id,
                reference: detail.reference,
                date: detail.date,
                timeSlot: detail.timeSlot,
                covers: detail.covers,
                status: detail.status,
                depositPaid: detail.depositPaid,
                customerName: detail.customerName,
                customerEmail: detail.customerEmail,
                customerPhone: detail.customerPhone,
                createdAt: detail.createdAt,
                updatedAt: detail.updatedAt
            )
        }
    }

    static func bookingDetail(id: String) -> AdminBookingDetail? {
        bookings.first { $0.id == id }
    }

    static func updateBooking(id: String, status: String) -> AdminBookingDetail? {
        guard let index = bookings.firstIndex(where: { $0.id == id }) else { return nil }
        let existing = bookings[index]
        let updated = AdminBookingDetail(
            id: existing.id,
            reference: existing.reference,
            date: existing.date,
            timeSlot: existing.timeSlot,
            covers: existing.covers,
            status: status,
            depositPaid: existing.depositPaid,
            depositPence: existing.depositPence,
            customerName: existing.customerName,
            customerEmail: existing.customerEmail,
            customerPhone: existing.customerPhone,
            tableId: existing.tableId,
            notes: existing.notes,
            createdAt: existing.createdAt,
            updatedAt: "2026-06-22T18:30:00Z"
        )
        bookings[index] = updated
        return updated
    }

    static func menuPayload() -> AdminMenuPayload {
        AdminMenuPayload(categories: categories, items: menuItems)
    }

    static func saveMenuItem(id: String?, input: MenuItemInput) -> AdminMenuItem {
        let item = AdminMenuItem(
            id: id ?? "item-demo-\(UUID().uuidString.prefix(8))",
            categoryId: input.categoryId,
            name: input.name,
            description: input.description,
            pricePence: input.pricePence,
            imageUrl: input.imageUrl,
            available: input.available,
            allergens: input.allergens,
            createdAt: nil
        )
        if let id, let index = menuItems.firstIndex(where: { $0.id == id }) {
            menuItems[index] = item
        } else {
            menuItems.append(item)
        }
        return item
    }

    static func deleteMenuItem(id: String) -> MenuDeleteResponse {
        menuItems.removeAll { $0.id == id }
        return MenuDeleteResponse(key: nil, id: id)
    }

    static func getSettings() -> AdminSettings { settings }
    static func updateSettings(_ input: AdminSettingsInput) -> AdminSettings {
        settings = AdminSettings(
            minDeliveryOrderPence: input.minDeliveryOrderPence,
            deliveryFeePence: input.deliveryFeePence,
            prepTimeMinutes: input.prepTimeMinutes,
            deliveryTimeMinutes: input.deliveryTimeMinutes,
            depositEnabled: input.depositEnabled,
            depositAmountPence: input.depositAmountPence,
            openingHours: input.openingHours
        )
        return settings
    }

    static func getTimeSlots() -> [AdminTimeSlot] { timeSlots }
    static func createTimeSlot(_ input: AdminTimeSlotInput) -> AdminTimeSlot {
        let slot = AdminTimeSlot(id: "slot-demo-\(UUID().uuidString.prefix(8))", type: input.type, time: input.time, active: input.active, createdAt: nil)
        timeSlots.append(slot)
        return slot
    }
    static func updateTimeSlot(_ slot: AdminTimeSlot) -> AdminTimeSlot {
        if let index = timeSlots.firstIndex(where: { $0.id == slot.id }) {
            timeSlots[index] = slot
        }
        return slot
    }

    static func getTables() -> [AdminTable] { tables }
    static func updateTable(_ update: AdminTableUpdate) -> AdminTable? {
        guard let index = tables.firstIndex(where: { $0.id == update.id }) else { return nil }
        tables[index].maxCovers = update.maxCovers
        tables[index].active = update.active
        return tables[index]
    }

    static func imageList() -> [AdminImage] { images }
    static func updateImage(id: String, url: String) -> AdminImage? {
        guard let index = images.firstIndex(where: { $0.id == id }) else { return nil }
        let existing = images[index]
        let updated = AdminImage(id: existing.id, label: existing.label, url: url, section: existing.section, updatedAt: "2026-06-22T18:30:00Z")
        images[index] = updated
        return updated
    }

    static func discountList() -> [AdminDiscount] { discounts }
    static func saveDiscount(id: String?, input: DiscountInput) -> AdminDiscount {
        let discount = AdminDiscount(
            id: id ?? "discount-demo-\(UUID().uuidString.prefix(8))",
            code: input.code,
            title: input.title,
            description: input.description,
            type: input.type,
            value: input.value,
            minOrderPence: input.minOrderPence,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            active: input.active,
            appliesToDelivery: input.appliesToDelivery,
            appliesToCollection: input.appliesToCollection,
            createdAt: nil,
            updatedAt: "2026-06-22T18:30:00Z"
        )
        if let id, let index = discounts.firstIndex(where: { $0.id == id }) {
            discounts[index] = discount
        } else {
            discounts.append(discount)
        }
        return discount
    }
    static func deleteDiscount(id: String) -> DiscountDeleteResponse {
        discounts.removeAll { $0.id == id }
        return DiscountDeleteResponse(key: nil, id: id)
    }
}
