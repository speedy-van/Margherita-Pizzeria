import Foundation
import SwiftUI

enum AdminLanguage: String, CaseIterable, Identifiable {
    case english = "en"
    case arabic = "ar"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .english: return "English"
        case .arabic: return "العربية"
        }
    }

    var shortName: String {
        switch self {
        case .english: return "EN"
        case .arabic: return "AR"
        }
    }

    var localeIdentifier: String {
        switch self {
        case .english: return "en_GB"
        case .arabic: return "ar"
        }
    }

    var layoutDirection: LayoutDirection {
        switch self {
        case .english: return .leftToRight
        case .arabic: return .rightToLeft
        }
    }
}

@MainActor
final class LanguageStore: ObservableObject {
    private let storageKey = "margherita_admin_language"

    @Published private(set) var language: AdminLanguage {
        didSet { UserDefaults.standard.set(language.rawValue, forKey: storageKey) }
    }

    init() {
        let raw = UserDefaults.standard.string(forKey: storageKey)
        self.language = AdminLanguage(rawValue: raw ?? "") ?? .english
    }

    var isArabic: Bool { language == .arabic }
    var locale: Locale { Locale(identifier: language.localeIdentifier) }
    var layoutDirection: LayoutDirection { language.layoutDirection }

    func setArabic(_ enabled: Bool) {
        language = enabled ? .arabic : .english
    }

    func toggle() {
        setArabic(!isArabic)
    }

    func text(_ key: String) -> String {
        AdminTranslations.text(key, language: language)
    }

    func status(_ raw: String) -> String {
        AdminTranslations.text("status.\(raw.lowercased())", language: language, fallback: prettyStatus(raw))
    }

    func orderType(_ raw: String) -> String {
        AdminTranslations.text("type.\(raw.lowercased())", language: language, fallback: raw.capitalized)
    }

    func role(_ raw: String) -> String {
        AdminTranslations.text("role.\(raw.lowercased())", language: language, fallback: raw.capitalized)
    }
}

enum AdminTranslations {
    static func text(
        _ key: String,
        language: AdminLanguage,
        fallback: String? = nil
    ) -> String {
        switch language {
        case .english:
            return english[key] ?? fallback ?? key
        case .arabic:
            return arabic[key] ?? english[key] ?? fallback ?? key
        }
    }

    private static let english: [String: String] = [
        "app.name": "Margherita Admin",
        "language": "Language",
        "language.arabic": "Arabic",
        "language.english": "English",
        "language.toggle": "Arabic interface",
        "language.helper": "Switches labels and layout direction.",
        "Legal & support": "Legal & support",
        "Privacy Policy": "Privacy Policy",
        "Support": "Support",

        "Dashboard": "Dashboard",
        "Orders": "Orders",
        "Bookings": "Bookings",
        "Menu": "Menu",
        "More": "More",
        "Settings": "Settings",
        "Images": "Images",
        "Discounts": "Discounts",

        "Loading…": "Loading…",
        "Something went wrong": "Something went wrong",
        "Try again": "Try again",
        "OK": "OK",
        "Dismiss": "Dismiss",
        "View": "View",
        "Settings saved.": "Settings saved.",
        "If that email is registered, a reset link is on its way.": "If that email is registered, a reset link is on its way.",
        "Network error.": "Network error.",
        "You have been signed out.": "You have been signed out.",
        "Not found.": "Not found.",
        "Please check the form and try again.": "Please check the form and try again.",
        "Server error.": "Server error.",
        "Request failed.": "Request failed.",
        "No HTTP response.": "No HTTP response.",
        "Signed out": "Signed out",
        "Your session expired. Please sign in again.": "Your session expired. Please sign in again.",

        "Manage": "Manage",
        "Account": "Account",
        "Server": "Server",
        "Build": "Build",
        "Sign out": "Sign out",
        "Sign out?": "Sign out?",
        "You'll need to enter your email and password again.": "You'll need to enter your email and password again.",

        "Manage live orders, bookings and the menu.": "Manage live orders, bookings and the menu.",
        "Email": "Email",
        "Password": "Password",
        "Hide password": "Hide password",
        "Show password": "Show password",
        "Signing in…": "Signing in…",
        "Sign in": "Sign in",
        "Forgot password?": "Forgot password?",
        "Reset your password": "Reset your password",
        "We'll email a reset link to the address on file.": "We'll email a reset link to the address on file.",
        "Send reset link": "Send reset link",
        "Back to sign in": "Back to sign in",
        "Forgot password": "Forgot password",

        "Recent orders": "Recent orders",
        "No orders yet.": "No orders yet.",
        "Recent bookings": "Recent bookings",
        "No bookings yet.": "No bookings yet.",
        "Total orders": "Total orders",
        "Order value": "Order value",
        "Pending orders": "Pending orders",
        "Total bookings": "Total bookings",
        "Pending bookings": "Pending bookings",
        "Today": "Today",

        "Search ref, name, phone, email": "Search ref, name, phone, email",
        "All status": "All status",
        "All types": "All types",
        "Delivery": "Delivery",
        "Collection": "Collection",
        "No orders": "No orders",
        "Try clearing the filters.": "Try clearing the filters.",
        "order": "order",
        "orders": "orders",
        "item": "item",
        "items": "items",
        "Guest": "Guest",

        "All": "All",
        "No bookings": "No bookings",
        "covers": "covers",

        "No menu items yet": "No menu items yet",
        "Tap + to add the first one.": "Tap + to add the first one.",
        "No items in this category.": "No items in this category.",
        "Uncategorised": "Uncategorised",
        "Delete": "Delete",
        "This cannot be undone.": "This cannot be undone.",
        "Item": "Item",
        "Name": "Name",
        "Description (optional)": "Description (optional)",
        "Price (£)": "Price (£)",
        "Available": "Available",
        "Category": "Category",
        "Image URL": "Image URL",
        "Allergens (comma-separated)": "Allergens (comma-separated)",
        "New item": "New item",
        "Edit item": "Edit item",
        "Cancel": "Cancel",
        "Saving…": "Saving…",
        "Save": "Save",

        "Customer": "Customer",
        "Phone": "Phone",
        "Address": "Address",
        "Payment": "Payment",
        "Notes": "Notes",
        "Totals": "Totals",
        "Subtotal": "Subtotal",
        "Discount": "Discount",
        "Total": "Total",
        "Update status": "Update status",
        "Apply": "Apply",
        "Current status": "Current status",
        "Order": "Order",
        "Booking": "Booking",
        "ETA": "ETA",
        "Deposit": "Deposit",
        "paid": "paid",
        "unpaid": "unpaid",
        "Table": "Table",

        "General": "General",
        "Min delivery order (£)": "Min delivery order (£)",
        "Delivery fee (£)": "Delivery fee (£)",
        "Prep time (min)": "Prep time (min)",
        "Delivery time (min)": "Delivery time (min)",
        "Deposit enabled": "Deposit enabled",
        "Deposit amount (£)": "Deposit amount (£)",
        "Save general": "Save general",
        "Opening hours": "Opening hours",
        "Closed": "Closed",
        "Save opening hours": "Save opening hours",
        "Time slots": "Time slots",
        "Type": "Type",
        "Time": "Time",
        "Add": "Add",
        "Tables": "Tables",
        "No tables configured.": "No tables configured.",
        "Alerts": "Alerts",
        "If you can hear this, audio alerts are wired correctly.": "If you can hear this, audio alerts are wired correctly.",
        "Fire test alert": "Fire test alert",
        "Re-request notification permission": "Re-request notification permission",

        "No images registered": "No images registered",
        "Image slots are seeded server-side.": "Image slots are seeded server-side.",
        "(no URL set)": "(no URL set)",
        "Edit": "Edit",

        "No discounts": "No discounts",
        "Tap + to create one.": "Tap + to create one.",
        "Active": "Active",
        "Inactive": "Inactive",
        "Code (e.g. WELCOME10)": "Code (e.g. WELCOME10)",
        "Title": "Title",
        "Percentage": "Percentage",
        "Fixed (£)": "Fixed (£)",
        "Value (%)": "Value (%)",
        "Value (£)": "Value (£)",
        "Min order (£)": "Min order (£)",
        "Validity": "Validity",
        "Starts at (ISO, optional)": "Starts at (ISO, optional)",
        "Ends at (ISO, optional)": "Ends at (ISO, optional)",
        "Applies to": "Applies to",
        "New discount": "New discount",
        "Edit discount": "Edit discount",
        "min": "min",
        "New order": "New order",
        "New booking": "New booking",
        "Invoices": "Invoices",
        "Invoice": "Invoice",
        "No invoices": "No invoices",
        "Orders will appear here once placed.": "Orders will appear here once placed.",
        "Share PDF": "Share PDF",
        "Send Invoice": "Send Invoice",

        "day.monday.short": "Mon",
        "day.tuesday.short": "Tue",
        "day.wednesday.short": "Wed",
        "day.thursday.short": "Thu",
        "day.friday.short": "Fri",
        "day.saturday.short": "Sat",
        "day.sunday.short": "Sun",

        "status.pending_payment": "Pending payment",
        "status.received": "Received",
        "status.making": "Making",
        "status.ready": "Ready",
        "status.out_for_delivery": "Out for delivery",
        "status.delivered": "Delivered",
        "status.cancelled": "Cancelled",
        "status.rejected": "Rejected",
        "status.pending": "Pending",
        "status.confirmed": "Confirmed",
        "status.seated": "Seated",
        "status.completed": "Completed",
        "status.no_show": "No show",
        "type.delivery": "Delivery",
        "type.collection": "Collection",
        "type.booking": "Booking",
        "role.admin": "Admin",
        "role.staff": "Staff",
    ]

    private static let arabic: [String: String] = [
        "app.name": "إدارة مارغريتا",
        "language": "اللغة",
        "language.arabic": "العربية",
        "language.english": "الإنجليزية",
        "language.toggle": "واجهة عربية",
        "language.helper": "يغيّر النصوص واتجاه الواجهة.",
        "Legal & support": "القانوني والدعم",
        "Privacy Policy": "سياسة الخصوصية",
        "Support": "الدعم",

        "Dashboard": "الرئيسية",
        "Orders": "الطلبات",
        "Bookings": "الحجوزات",
        "Menu": "المنيو",
        "More": "المزيد",
        "Settings": "الإعدادات",
        "Images": "الصور",
        "Discounts": "الخصومات",

        "Loading…": "جار التحميل…",
        "Something went wrong": "حدث خطأ",
        "Try again": "حاول مرة أخرى",
        "OK": "حسناً",
        "Dismiss": "إغلاق",
        "View": "عرض",
        "Settings saved.": "تم حفظ الإعدادات.",
        "If that email is registered, a reset link is on its way.": "إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين.",
        "Network error.": "خطأ في الاتصال بالشبكة.",
        "You have been signed out.": "تم تسجيل خروجك.",
        "Not found.": "غير موجود.",
        "Please check the form and try again.": "راجع البيانات وحاول مرة أخرى.",
        "Server error.": "خطأ في الخادم.",
        "Request failed.": "فشل الطلب.",
        "No HTTP response.": "لا يوجد رد من الخادم.",
        "Signed out": "تم تسجيل الخروج",
        "Your session expired. Please sign in again.": "انتهت الجلسة. سجّل الدخول مرة أخرى.",

        "Manage": "الإدارة",
        "Account": "الحساب",
        "Server": "الخادم",
        "Build": "الإصدار",
        "Sign out": "تسجيل الخروج",
        "Sign out?": "تسجيل الخروج؟",
        "You'll need to enter your email and password again.": "ستحتاج لإدخال البريد وكلمة المرور مرة أخرى.",

        "Manage live orders, bookings and the menu.": "إدارة الطلبات والحجوزات والمنيو مباشرة.",
        "Email": "البريد الإلكتروني",
        "Password": "كلمة المرور",
        "Hide password": "إخفاء كلمة المرور",
        "Show password": "إظهار كلمة المرور",
        "Signing in…": "جار تسجيل الدخول…",
        "Sign in": "تسجيل الدخول",
        "Forgot password?": "نسيت كلمة المرور؟",
        "Reset your password": "إعادة تعيين كلمة المرور",
        "We'll email a reset link to the address on file.": "سنرسل رابط إعادة التعيين إلى البريد المسجل.",
        "Send reset link": "إرسال رابط إعادة التعيين",
        "Back to sign in": "العودة لتسجيل الدخول",
        "Forgot password": "نسيت كلمة المرور",

        "Recent orders": "آخر الطلبات",
        "No orders yet.": "لا توجد طلبات بعد.",
        "Recent bookings": "آخر الحجوزات",
        "No bookings yet.": "لا توجد حجوزات بعد.",
        "Total orders": "إجمالي الطلبات",
        "Order value": "قيمة الطلبات",
        "Pending orders": "طلبات بانتظار المعالجة",
        "Total bookings": "إجمالي الحجوزات",
        "Pending bookings": "حجوزات بانتظار المعالجة",
        "Today": "اليوم",

        "Search ref, name, phone, email": "ابحث بالرقم أو الاسم أو الهاتف أو البريد",
        "All status": "كل الحالات",
        "All types": "كل الأنواع",
        "Delivery": "توصيل",
        "Collection": "استلام",
        "No orders": "لا توجد طلبات",
        "Try clearing the filters.": "جرّب إزالة الفلاتر.",
        "order": "طلب",
        "orders": "طلبات",
        "item": "عنصر",
        "items": "عناصر",
        "Guest": "ضيف",

        "All": "الكل",
        "No bookings": "لا توجد حجوزات",
        "covers": "أشخاص",

        "No menu items yet": "لا توجد عناصر في المنيو بعد",
        "Tap + to add the first one.": "اضغط + لإضافة أول عنصر.",
        "No items in this category.": "لا توجد عناصر في هذا القسم.",
        "Uncategorised": "بدون قسم",
        "Delete": "حذف",
        "This cannot be undone.": "لا يمكن التراجع عن هذا الإجراء.",
        "Item": "العنصر",
        "Name": "الاسم",
        "Description (optional)": "الوصف (اختياري)",
        "Price (£)": "السعر (£)",
        "Available": "متاح",
        "Category": "القسم",
        "Image URL": "رابط الصورة",
        "Allergens (comma-separated)": "مسببات الحساسية (مفصولة بفواصل)",
        "New item": "عنصر جديد",
        "Edit item": "تعديل عنصر",
        "Cancel": "إلغاء",
        "Saving…": "جار الحفظ…",
        "Save": "حفظ",

        "Customer": "العميل",
        "Phone": "الهاتف",
        "Address": "العنوان",
        "Payment": "الدفع",
        "Notes": "ملاحظات",
        "Totals": "الإجمالي",
        "Subtotal": "المجموع الفرعي",
        "Discount": "الخصم",
        "Total": "الإجمالي",
        "Update status": "تحديث الحالة",
        "Apply": "تطبيق",
        "Current status": "الحالة الحالية",
        "Order": "طلب",
        "Booking": "حجز",
        "ETA": "الوقت المتوقع",
        "Deposit": "العربون",
        "paid": "مدفوع",
        "unpaid": "غير مدفوع",
        "Table": "الطاولة",

        "General": "عام",
        "Min delivery order (£)": "الحد الأدنى للتوصيل (£)",
        "Delivery fee (£)": "رسوم التوصيل (£)",
        "Prep time (min)": "وقت التحضير (دقيقة)",
        "Delivery time (min)": "وقت التوصيل (دقيقة)",
        "Deposit enabled": "تفعيل العربون",
        "Deposit amount (£)": "قيمة العربون (£)",
        "Save general": "حفظ الإعدادات العامة",
        "Opening hours": "ساعات العمل",
        "Closed": "مغلق",
        "Save opening hours": "حفظ ساعات العمل",
        "Time slots": "الأوقات",
        "Type": "النوع",
        "Time": "الوقت",
        "Add": "إضافة",
        "Tables": "الطاولات",
        "No tables configured.": "لا توجد طاولات مضافة.",
        "Alerts": "التنبيهات",
        "If you can hear this, audio alerts are wired correctly.": "إذا سمعت هذا الصوت، فتنبيهات الصوت تعمل بشكل صحيح.",
        "Fire test alert": "تشغيل تنبيه تجريبي",
        "Re-request notification permission": "طلب إذن الإشعارات مرة أخرى",

        "No images registered": "لا توجد صور مسجلة",
        "Image slots are seeded server-side.": "أماكن الصور مضافة من الخادم.",
        "(no URL set)": "(لا يوجد رابط)",
        "Edit": "تعديل",

        "No discounts": "لا توجد خصومات",
        "Tap + to create one.": "اضغط + لإنشاء خصم.",
        "Active": "نشط",
        "Inactive": "غير نشط",
        "Code (e.g. WELCOME10)": "الكود (مثال WELCOME10)",
        "Title": "العنوان",
        "Percentage": "نسبة مئوية",
        "Fixed (£)": "مبلغ ثابت (£)",
        "Value (%)": "القيمة (%)",
        "Value (£)": "القيمة (£)",
        "Min order (£)": "أقل طلب (£)",
        "Validity": "الصلاحية",
        "Starts at (ISO, optional)": "يبدأ في (ISO، اختياري)",
        "Ends at (ISO, optional)": "ينتهي في (ISO، اختياري)",
        "Applies to": "ينطبق على",
        "New discount": "خصم جديد",
        "Edit discount": "تعديل خصم",
        "min": "حد أدنى",
        "New order": "طلب جديد",
        "New booking": "حجز جديد",
        "Invoices": "الفواتير",
        "Invoice": "فاتورة",
        "No invoices": "لا توجد فواتير",
        "Orders will appear here once placed.": "ستظهر الطلبات هنا بعد إضافتها.",
        "Share PDF": "مشاركة PDF",
        "Send Invoice": "إرسال الفاتورة",

        "day.monday.short": "الاثنين",
        "day.tuesday.short": "الثلاثاء",
        "day.wednesday.short": "الأربعاء",
        "day.thursday.short": "الخميس",
        "day.friday.short": "الجمعة",
        "day.saturday.short": "السبت",
        "day.sunday.short": "الأحد",

        "status.pending_payment": "بانتظار الدفع",
        "status.received": "تم الاستلام",
        "status.making": "قيد التحضير",
        "status.ready": "جاهز",
        "status.out_for_delivery": "خرج للتوصيل",
        "status.delivered": "تم التوصيل",
        "status.cancelled": "ملغي",
        "status.rejected": "مرفوض",
        "status.pending": "بانتظار التأكيد",
        "status.confirmed": "مؤكد",
        "status.seated": "تم الجلوس",
        "status.completed": "مكتمل",
        "status.no_show": "لم يحضر",
        "type.delivery": "توصيل",
        "type.collection": "استلام",
        "type.booking": "حجز",
        "role.admin": "مدير",
        "role.staff": "موظف",
    ]
}

func prettyStatus(_ s: String, language: LanguageStore) -> String {
    language.status(s)
}
