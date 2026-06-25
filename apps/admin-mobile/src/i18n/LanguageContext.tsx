import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { I18nManager } from "react-native";

type AdminLanguage = "en" | "ar";

type LanguageApi = {
  language: AdminLanguage;
  isArabic: boolean;
  setArabic: (enabled: boolean) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  role: (value?: string | null) => string;
  status: (value: string) => string;
  relativeTime: (iso?: string | null) => string;
};

const STORAGE_KEY = "margherita_admin_language";

const translations: Record<AdminLanguage, Record<string, string>> = {
  en: {
    Home: "Home",
    Dashboard: "Dashboard",
    Orders: "Orders",
    Bookings: "Bookings",
    Menu: "Menu",
    More: "More",
    Order: "Order",
    Booking: "Booking",
    Settings: "Settings",
    Discounts: "Discounts",
    Images: "Images",
    Invoices: "Invoices",
    Invoice: "Invoice",
    "Edit item": "Edit item",
    "New item": "New item",
    "Edit discount": "Edit discount",
    "New discount": "New discount",
    "Forgot password": "Forgot password",

    Configuration: "Configuration",
    Account: "Account",
    Language: "Language",
    "Arabic interface": "Arabic interface",
    "Switch labels and layout direction.": "Switch labels and layout direction.",
    "Legal & support": "Legal & support",
    "Privacy Policy": "Privacy Policy",
    Support: "Support",
    "How we handle order and account data": "How we handle order and account data",
    "Delivery, hours, deposits": "Delivery, hours, deposits",
    "Codes and promotions": "Codes and promotions",
    "Website photos": "Website photos",
    "Customer invoices": "Customer invoices",
    Refresh: "Refresh",
    "Search ref, name, phone, email": "Search ref, name, phone, email",
    "No invoices": "No invoices",
    "No invoices match this search.": "No invoices match this search.",
    "Orders will appear here once placed.": "Orders will appear here once placed.",
    "Invoice not found": "Invoice not found",
    Issued: "Issued",
    "Order ref": "Order ref",
    "Order type": "Order type",
    Payment: "Payment",
    Card: "Card",
    Cash: "Cash",
    "Bill to": "Bill to",
    "Invoice items": "Invoice items",
    Subtotal: "Subtotal",
    Delivery: "Delivery",
    Discount: "Discount",
    "Invoice total": "Invoice total",
    "This customer does not have an email address.":
      "This customer does not have an email address.",
    "Email invoice": "Email invoice",
    "Email invoice PDF": "Email invoice PDF",
    "Refresh invoices": "Refresh invoices",
    "Try again": "Try again",
    "Retry loading invoices": "Retry loading invoices",
    "Retry loading invoice": "Retry loading invoice",
    "Open invoice": "Open invoice",
    "Could not load invoice.": "Could not load invoice.",
    "Missing email": "Missing email",
    "Enter a customer email address before sending.":
      "Enter a customer email address before sending.",
    "Invalid email": "Invalid email",
    "Enter a valid email address.": "Enter a valid email address.",
    "Send cancelled invoice?": "Send cancelled invoice?",
    "This invoice is cancelled or rejected. Send it anyway?":
      "This invoice is cancelled or rejected. Send it anyway?",
    "Send invoice": "Send invoice",
    "Invoice sent": "Invoice sent",
    "Invoice email was prepared in demo mode.":
      "Invoice email was prepared in demo mode.",
    "Invoice sent to": "Invoice sent to",
    "Email failed": "Email failed",
    Print: "Print",
    "Print invoice PDF": "Print invoice PDF",
    "Print failed": "Print failed",
    "Share PDF": "Share PDF",
    "Share invoice PDF": "Share invoice PDF",
    "Share failed": "Share failed",
    "Sharing is not available on this device.":
      "Sharing is not available on this device.",
    "Save PDF": "Save PDF",
    "Save invoice PDF": "Save invoice PDF",
    "PDF saved": "PDF saved",
    "Saved as": "Saved as",
    "Save failed": "Save failed",
    "Email recipient": "Email recipient",
    "Customer email": "Customer email",
    "No invoice items": "No invoice items",
    each: "each",
    "Sign out": "Sign out",
    "Sign out?": "Sign out?",
    "You'll need to enter your password again.":
      "You'll need to enter your password again.",
    Cancel: "Cancel",
    Admin: "Admin",
    Staff: "Staff",
    All: "All",
    Pending: "Pending",
    Confirmed: "Confirmed",
    Completed: "Completed",
    Cancelled: "Cancelled",
    Rejected: "Rejected",
    "No bookings for this filter": "No bookings for this filter",
    covers: "covers",
    cover: "cover",
    Booked: "Booked",
    "just now": "just now",
    Yesterday: "Yesterday",
    "status.pending": "Pending",
    "status.confirmed": "Confirmed",
    "status.completed": "Completed",
    "status.cancelled": "Cancelled",
    "status.rejected": "Rejected",
    "status.pending_payment": "Pending payment",
    "status.received": "Received",
    "status.making": "Making",
    "status.ready": "Ready",
    "status.out_for_delivery": "Out for delivery",
    "status.delivered": "Delivered",
  },
  ar: {
    Home: "الرئيسية",
    Dashboard: "الرئيسية",
    Orders: "الطلبات",
    Bookings: "الحجوزات",
    Menu: "المنيو",
    More: "المزيد",
    Order: "طلب",
    Booking: "حجز",
    Settings: "الإعدادات",
    Discounts: "الخصومات",
    Images: "الصور",
    Invoices: "الفواتير",
    Invoice: "فاتورة",
    "Edit item": "تعديل عنصر",
    "New item": "عنصر جديد",
    "Edit discount": "تعديل خصم",
    "New discount": "خصم جديد",
    "Forgot password": "نسيت كلمة المرور",

    Configuration: "الإعدادات",
    Account: "الحساب",
    Language: "اللغة",
    "Arabic interface": "واجهة عربية",
    "Switch labels and layout direction.": "تغيير النصوص واتجاه الواجهة.",
    "Legal & support": "القانوني والدعم",
    "Privacy Policy": "سياسة الخصوصية",
    Support: "الدعم",
    "How we handle order and account data": "كيف نتعامل مع بيانات الطلبات والحساب",
    "Delivery, hours, deposits": "التوصيل، ساعات العمل، العربون",
    "Codes and promotions": "الأكواد والعروض",
    "Website photos": "صور الموقع",
    "Customer invoices": "فواتير العملاء",
    Refresh: "تحديث",
    "Search ref, name, phone, email": "ابحث بالرقم أو الاسم أو الهاتف أو البريد",
    "No invoices": "لا توجد فواتير",
    "No invoices match this search.": "لا توجد فواتير تطابق البحث.",
    "Orders will appear here once placed.": "ستظهر الطلبات هنا عند إنشائها.",
    "Invoice not found": "الفاتورة غير موجودة",
    Issued: "تاريخ الإصدار",
    "Order ref": "رقم الطلب",
    "Order type": "نوع الطلب",
    Payment: "الدفع",
    Card: "بطاقة",
    Cash: "نقدا",
    "Bill to": "فاتورة إلى",
    "Invoice items": "عناصر الفاتورة",
    Subtotal: "المجموع الفرعي",
    Delivery: "التوصيل",
    Discount: "الخصم",
    "Invoice total": "إجمالي الفاتورة",
    "This customer does not have an email address.":
      "هذا العميل لا يملك بريد إلكتروني.",
    "Email invoice": "إرسال الفاتورة",
    "Email invoice PDF": "إرسال الفاتورة PDF",
    "Refresh invoices": "تحديث الفواتير",
    "Try again": "حاول مرة أخرى",
    "Retry loading invoices": "إعادة تحميل الفواتير",
    "Retry loading invoice": "إعادة تحميل الفاتورة",
    "Open invoice": "فتح الفاتورة",
    "Could not load invoice.": "تعذر تحميل الفاتورة.",
    "Missing email": "البريد الإلكتروني مطلوب",
    "Enter a customer email address before sending.":
      "أدخل بريد العميل قبل الإرسال.",
    "Invalid email": "بريد إلكتروني غير صحيح",
    "Enter a valid email address.": "أدخل بريد إلكتروني صحيح.",
    "Send cancelled invoice?": "إرسال فاتورة ملغاة؟",
    "This invoice is cancelled or rejected. Send it anyway?":
      "هذه الفاتورة ملغاة أو مرفوضة. هل تريد إرسالها؟",
    "Send invoice": "إرسال الفاتورة",
    "Invoice sent": "تم إرسال الفاتورة",
    "Invoice email was prepared in demo mode.":
      "تم تجهيز رسالة الفاتورة في وضع التجربة.",
    "Invoice sent to": "تم إرسال الفاتورة إلى",
    "Email failed": "فشل إرسال البريد",
    Print: "طباعة",
    "Print invoice PDF": "طباعة الفاتورة PDF",
    "Print failed": "فشلت الطباعة",
    "Share PDF": "مشاركة PDF",
    "Share invoice PDF": "مشاركة الفاتورة PDF",
    "Share failed": "فشلت المشاركة",
    "Sharing is not available on this device.":
      "المشاركة غير متاحة على هذا الجهاز.",
    "Save PDF": "حفظ PDF",
    "Save invoice PDF": "حفظ الفاتورة PDF",
    "PDF saved": "تم حفظ PDF",
    "Saved as": "تم الحفظ باسم",
    "Save failed": "فشل الحفظ",
    "Email recipient": "البريد المستلم",
    "Customer email": "بريد العميل",
    "No invoice items": "لا توجد عناصر في الفاتورة",
    each: "للوحدة",
    "Sign out": "تسجيل الخروج",
    "Sign out?": "تسجيل الخروج؟",
    "You'll need to enter your password again.":
      "ستحتاج إلى إدخال كلمة المرور مرة أخرى.",
    Cancel: "إلغاء",
    Admin: "مدير",
    Staff: "موظف",
    All: "الكل",
    Pending: "قيد الانتظار",
    Confirmed: "مؤكد",
    Completed: "مكتمل",
    Cancelled: "ملغي",
    Rejected: "مرفوض",
    "No bookings for this filter": "لا توجد حجوزات لهذا الفلتر",
    covers: "أشخاص",
    cover: "شخص",
    Booked: "تم الحجز",
    "just now": "الآن",
    Yesterday: "أمس",
    "status.pending": "قيد الانتظار",
    "status.confirmed": "مؤكد",
    "status.completed": "مكتمل",
    "status.cancelled": "ملغي",
    "status.rejected": "مرفوض",
    "status.pending_payment": "بانتظار الدفع",
    "status.received": "تم الاستلام",
    "status.making": "قيد التحضير",
    "status.ready": "جاهز",
    "status.out_for_delivery": "خرج للتوصيل",
    "status.delivered": "تم التوصيل",
  },
};

const LanguageContext = createContext<LanguageApi | null>(null);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [language, setLanguageState] = useState<AdminLanguage>("en");

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!mounted) return;
      if (stored === "ar" || stored === "en") {
        setLanguageState(stored);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(language === "ar");
  }, [language]);

  const setLanguage = useCallback((next: AdminLanguage) => {
    setLanguageState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const setArabic = useCallback(
    (enabled: boolean) => {
      setLanguage(enabled ? "ar" : "en");
    },
    [setLanguage],
  );

  const t = useCallback(
    (key: string): string => translations[language][key] ?? translations.en[key] ?? key,
    [language],
  );

  const role = useCallback(
    (value?: string | null): string => {
      if (!value) return "";
      const normalised = value.trim().toLowerCase();
      if (normalised === "admin") return t("Admin");
      if (normalised === "staff") return t("Staff");
      return value;
    },
    [t],
  );

  const status = useCallback(
    (value: string): string => t(`status.${value.toLowerCase()}`),
    [t],
  );

  const relativeTime = useCallback(
    (iso?: string | null): string => {
      if (!iso) return "—";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const diffMs = Date.now() - d.getTime();
      const sec = Math.round(diffMs / 1000);
      if (sec < 5) return t("just now");
      if (sec < 60) return language === "ar" ? `قبل ${sec} ثانية` : `${sec}s ago`;
      const min = Math.round(sec / 60);
      if (min < 60) return language === "ar" ? `قبل ${min} دقيقة` : `${min}m ago`;
      const hr = Math.round(min / 60);
      if (hr < 24) return language === "ar" ? `قبل ${hr} ساعة` : `${hr}h ago`;
      const day = Math.round(hr / 24);
      if (day === 1) return t("Yesterday");
      if (day < 7) return language === "ar" ? `قبل ${day} يوم` : `${day}d ago`;
      return d.toLocaleDateString(language === "ar" ? "ar" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
    [language, t],
  );

  const value = useMemo<LanguageApi>(
    () => ({
      language,
      isArabic: language === "ar",
      setArabic,
      toggleLanguage: () => setArabic(language !== "ar"),
      t,
      role,
      status,
      relativeTime,
    }),
    [language, relativeTime, role, setArabic, status, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageApi {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}
