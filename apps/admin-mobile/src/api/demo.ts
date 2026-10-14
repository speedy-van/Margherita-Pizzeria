import type { ApiCallResult } from "@/api/client";
import type {
  AdminBookingDetail,
  AdminBookingListItem,
  AdminDashboardStats,
  AdminDiscount,
  AdminImage,
  AdminMenuCategory,
  AdminMenuItem,
  AdminMenuPayload,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminSettings,
  AdminUser,
  BookingStatus,
  InvoiceDocumentModel,
  LoginResponse,
  OrderStatus,
  OrderType,
  PaymentMethod,
  SendInvoiceEmailResponse,
} from "@/api/types";

export const DEMO_EMAIL = "review@margheritapizza.uk";
export const DEMO_PASSWORD = "AppleReview2026!";
export const DEMO_TOKEN = "demo-review-token";

const now = "2026-06-22T18:30:00.000Z";

const demoUser: AdminUser = {
  id: "demo-reviewer",
  email: DEMO_EMAIL,
  role: "admin",
};

let orders: AdminOrderDetail[] = [
  {
    id: "demo-order-1001",
    reference: "DEMO-1001",
    type: "delivery",
    status: "received",
    customerName: "Apple Review",
    customerEmail: "reviewer@example.com",
    customerPhone: "+44 7700 900123",
    totalPence: 2471,
    paymentMethod: "stripe_card",
    itemCount: 3,
    createdAt: "2026-06-22T18:20:00.000Z",
    updatedAt: "2026-06-22T18:25:00.000Z",
    address: "1 Infinite Loop, Glasgow",
    subtotalPence: 2022,
    deliveryFeePence: 449,
    discountPence: 0,
    discountCode: null,
    estimatedTime: "25-35 min",
    items: [
      {
        menuItemId: "item-margherita",
        name: 'Margherita (12")',
        quantity: 1,
        unitPricePence: 968,
        totalPence: 968,
        allergens: ["dairy", "gluten"],
      },
      {
        menuItemId: "item-shawarma",
        name: "Chicken Shawarma Wrap",
        quantity: 1,
        unitPricePence: 615,
        totalPence: 615,
        allergens: ["gluten"],
      },
      {
        menuItemId: "item-chips",
        name: "Chips",
        quantity: 1,
        unitPricePence: 439,
        totalPence: 439,
        allergens: [],
      },
    ],
  },
  {
    id: "demo-order-1002",
    reference: "DEMO-1002",
    type: "collection",
    status: "making",
    customerName: "Test Collection",
    customerEmail: "collection@example.com",
    customerPhone: "+44 7700 900456",
    totalPence: 1583,
    paymentMethod: "cash_on_delivery",
    itemCount: 2,
    createdAt: "2026-06-22T18:05:00.000Z",
    updatedAt: "2026-06-22T18:15:00.000Z",
    address: null,
    subtotalPence: 1583,
    deliveryFeePence: 0,
    discountPence: 0,
    discountCode: null,
    estimatedTime: "Ready at 19:00",
    items: [
      {
        menuItemId: "item-pepperoni",
        name: 'Pepperoni (16")',
        quantity: 1,
        unitPricePence: 1496,
        totalPence: 1496,
        allergens: ["dairy", "gluten"],
      },
      {
        menuItemId: "item-garlic-mayo",
        name: "Garlic Mayo",
        quantity: 1,
        unitPricePence: 87,
        totalPence: 87,
        allergens: ["egg"],
      },
    ],
  },
];

let bookings: AdminBookingDetail[] = [
  {
    id: "demo-booking-2001",
    reference: "BOOK-2001",
    date: "2026-06-23",
    timeSlot: "19:30",
    covers: 4,
    status: "pending",
    depositPaid: true,
    customerName: "Demo Booking",
    customerEmail: "booking@example.com",
    customerPhone: "+44 7700 900789",
    createdAt: "2026-06-22T17:00:00.000Z",
    updatedAt: "2026-06-22T17:00:00.000Z",
    tableId: "Table 4",
  },
];

const categories: AdminMenuCategory[] = [
  {
    id: "cat-pizza",
    name: "Stone Baked Pizzas",
    displayOrder: 10,
    active: true,
    createdAt: "2026-06-22T12:00:00.000Z",
  },
  {
    id: "cat-sides",
    name: "Sides",
    displayOrder: 20,
    active: true,
    createdAt: "2026-06-22T12:00:00.000Z",
  },
  {
    id: "cat-drinks",
    name: "Drinks",
    displayOrder: 30,
    active: true,
    createdAt: "2026-06-22T12:00:00.000Z",
  },
];

let menuItems: AdminMenuItem[] = [
  {
    id: "item-margherita",
    categoryId: "cat-pizza",
    name: 'Margherita (12")',
    description: "Fresh mozzarella, parmesan and basil.",
    pricePence: 968,
    imageUrl: "",
    available: true,
    allergens: ["dairy", "gluten"],
    createdAt: "2026-06-22T12:00:00.000Z",
  },
  {
    id: "item-pepperoni",
    categoryId: "cat-pizza",
    name: 'Pepperoni (16")',
    description: "Pepperoni, cherry tomato and mozzarella.",
    pricePence: 1496,
    imageUrl: "",
    available: true,
    allergens: ["dairy", "gluten"],
    createdAt: "2026-06-22T12:00:00.000Z",
  },
  {
    id: "item-chips",
    categoryId: "cat-sides",
    name: "Chips",
    description: "Skin-on chips.",
    pricePence: 351,
    imageUrl: "",
    available: true,
    allergens: [],
    createdAt: "2026-06-22T12:00:00.000Z",
  },
  {
    id: "item-coke",
    categoryId: "cat-drinks",
    name: "Can - Coke",
    description: "330ml can.",
    pricePence: 106,
    imageUrl: "",
    available: false,
    allergens: [],
    createdAt: "2026-06-22T12:00:00.000Z",
  },
];

let settings: AdminSettings = {
  acceptingOnlineOrders: true,
  collectionOpen: true,
  deliveryOpen: true,
  busyMode: "normal",
  minDeliveryOrderPence: 1000,
  deliveryFeePence: 449,
  prepTimeMinutes: 25,
  deliveryTimeMinutes: 40,
  customerMessage: "",
  depositEnabled: true,
  depositAmountPence: 500,
  openingHours: {
    monday: { open: "11:00", close: "23:00", closed: false },
    tuesday: { open: "11:00", close: "23:00", closed: false },
    wednesday: { open: "11:00", close: "23:00", closed: false },
    thursday: { open: "11:00", close: "23:00", closed: false },
    friday: { open: "11:00", close: "00:00", closed: false },
    saturday: { open: "11:00", close: "00:00", closed: false },
    sunday: { open: "11:00", close: "23:00", closed: false },
  },
};

let images: AdminImage[] = [
  {
    id: "image-hero",
    label: "Home hero",
    url: "https://www.margheritapizza.uk/uploads/hero.jpg",
    section: "hero",
    updatedAt: now,
  },
  {
    id: "image-menu",
    label: "Menu header",
    url: "",
    section: "menu",
    updatedAt: now,
  },
];

let discounts: AdminDiscount[] = [
  {
    id: "discount-demo10",
    code: "DEMO10",
    title: "Demo review discount",
    description: "Local demo only.",
    type: "percentage",
    value: 10,
    minOrderPence: 1500,
    startsAt: null,
    endsAt: null,
    active: false,
    appliesToDelivery: true,
    appliesToCollection: true,
    createdAt: now,
    updatedAt: now,
  },
];

export function isDemoCredential(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function isDemoToken(token: string | null): boolean {
  return token === DEMO_TOKEN;
}

export function demoApiCall<T>({
  method,
  path,
  body,
  token,
}: {
  method: string;
  path: string;
  body?: unknown;
  token: string | null;
}): ApiCallResult<T> | null {
  if (method === "POST" && path === "/api/mobile/admin/login") {
    const input = body as { email?: string; password?: string } | null;
    if (isDemoCredential(input?.email ?? "", input?.password ?? "")) {
      return success({
        token: DEMO_TOKEN,
        expiresAt: "2099-12-31T23:59:59.000Z",
        user: demoUser,
      } satisfies LoginResponse);
    }
    return null;
  }

  if (!isDemoToken(token)) return null;

  if (path === "/api/mobile/admin/me") {
    return success({ user: demoUser });
  }
  if (path === "/api/mobile/admin/logout") {
    return success({ ok: true });
  }
  if (path === "/api/admin/dashboard" || path === "/api/admin/dashboard?view=badges") {
    return success(buildDashboard());
  }
  if (path === "/api/admin/orders") {
    return success(orderList());
  }
  if (path.startsWith("/api/admin/invoices/")) {
    return handleInvoice<T>(method, path, body);
  }
  if (path.startsWith("/api/admin/orders/")) {
    return handleOrder<T>(method, path, body);
  }
  if (path === "/api/admin/bookings") {
    return success(bookingList());
  }
  if (path.startsWith("/api/admin/bookings/")) {
    return handleBooking<T>(method, path, body);
  }
  if (path === "/api/admin/menu") {
    return success({ categories, items: menuItems } satisfies AdminMenuPayload);
  }
  if (path === "/api/admin/menu/items" && method === "POST") {
    return success(saveMenuItem(null, body));
  }
  if (path.startsWith("/api/admin/menu/items/")) {
    return handleMenuItem<T>(method, path, body);
  }
  if (path === "/api/admin/settings") {
    if (method === "PUT") settings = body as AdminSettings;
    return success(settings);
  }
  if (path === "/api/admin/images") {
    if (method === "POST") {
      const input = body as { label?: string; section?: string } | null;
      const image: AdminImage = {
        id: `image-demo-${Date.now()}`,
        label: input?.label?.trim() || "Demo image",
        section: input?.section?.trim() || "menu",
        url: "",
        updatedAt: now,
      };
      images = [image, ...images];
      return success(image);
    }
    return success(images);
  }
  if (path.startsWith("/api/admin/images/")) {
    return handleImage<T>(method, path, body);
  }
  if (path === "/api/admin/discounts") {
    if (method === "POST") return success(saveDiscount(null, body));
    return success(discounts);
  }
  if (path.startsWith("/api/admin/discounts/")) {
    return handleDiscount<T>(method, path, body);
  }

  return failure("DEMO_NOT_FOUND", "Demo data is not available for this screen.", 404);
}

export function demoUpload<T>({
  path,
  token,
}: {
  path: string;
  token: string | null;
}): ApiCallResult<T> | null {
  if (!isDemoToken(token)) return null;

  if (path === "/api/admin/uploads") {
    return success({ url: "https://www.margheritapizza.uk/uploads/demo-menu-photo.jpg" });
  }

  const imageUpload = path.match(/^\/api\/admin\/images\/([^/]+)\/upload$/);
  if (imageUpload?.[1]) {
    const updated = updateImage(imageUpload[1], "https://www.margheritapizza.uk/uploads/demo-review-image.jpg");
    return updated ? success(updated) : failure("NOT_FOUND", "Image not found.", 404);
  }

  return failure("DEMO_UPLOAD_NOT_FOUND", "Demo upload is not available here.", 404);
}

function handleOrder<T>(
  method: string,
  path: string,
  body: unknown,
): ApiCallResult<T> {
  const statusMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (statusMatch?.[1] && method === "POST") {
    const input = body as { status?: OrderStatus } | null;
    const updated = updateOrder(statusMatch[1], input?.status ?? "received");
    return updated ? success(updated) : failure("NOT_FOUND", "Order not found.", 404);
  }

  const detailMatch = path.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if (detailMatch?.[1]) {
    const order = orders.find((item) => item.id === detailMatch[1]);
    return order ? success(order) : failure("NOT_FOUND", "Order not found.", 404);
  }

  return failure("NOT_FOUND", "Order route not found.", 404);
}

function handleInvoice<T>(
  method: string,
  path: string,
  body: unknown,
): ApiCallResult<T> {
  const emailMatch = path.match(/^\/api\/admin\/invoices\/([^/]+)\/email$/);
  if (emailMatch?.[1] && method === "POST") {
    const order = orders.find((item) => item.id === emailMatch[1]);
    if (!order) return failure("NOT_FOUND", "Invoice not found.", 404);
    const input = body as { email?: string } | null;
    const invoice = buildDemoInvoice(order);
    return success({
      invoiceNumber: invoice.invoiceNumber,
      toEmail: input?.email?.trim() || invoice.customer.email,
      id: null,
      skipped: true,
    } satisfies SendInvoiceEmailResponse);
  }

  const detailMatch = path.match(/^\/api\/admin\/invoices\/([^/]+)$/);
  if (detailMatch?.[1]) {
    const order = orders.find((item) => item.id === detailMatch[1]);
    return order
      ? success(buildDemoInvoice(order))
      : failure("NOT_FOUND", "Invoice not found.", 404);
  }

  return failure("NOT_FOUND", "Invoice route not found.", 404);
}

function handleBooking<T>(
  method: string,
  path: string,
  body: unknown,
): ApiCallResult<T> {
  const statusMatch = path.match(/^\/api\/admin\/bookings\/([^/]+)\/status$/);
  if (statusMatch?.[1] && method === "POST") {
    const input = body as { status?: BookingStatus } | null;
    const updated = updateBooking(statusMatch[1], input?.status ?? "confirmed");
    return updated ? success(updated) : failure("NOT_FOUND", "Booking not found.", 404);
  }

  const detailMatch = path.match(/^\/api\/admin\/bookings\/([^/]+)$/);
  if (detailMatch?.[1]) {
    const booking = bookings.find((item) => item.id === detailMatch[1]);
    return booking ? success(booking) : failure("NOT_FOUND", "Booking not found.", 404);
  }

  return failure("NOT_FOUND", "Booking route not found.", 404);
}

function handleMenuItem<T>(
  method: string,
  path: string,
  body: unknown,
): ApiCallResult<T> {
  const match = path.match(/^\/api\/admin\/menu\/items\/([^/]+)$/);
  if (!match?.[1]) return failure("NOT_FOUND", "Menu item route not found.", 404);
  if (method === "DELETE") {
    menuItems = menuItems.filter((item) => item.id !== match[1]);
    return success({ id: match[1] });
  }
  if (method === "PUT") {
    return success(saveMenuItem(match[1], body));
  }
  return failure("METHOD_NOT_ALLOWED", "Unsupported demo menu action.", 405);
}

function handleImage<T>(
  method: string,
  path: string,
  body: unknown,
): ApiCallResult<T> {
  const match = path.match(/^\/api\/admin\/images\/([^/]+)$/);
  if (!match?.[1]) return failure("NOT_FOUND", "Image route not found.", 404);
  if (method === "DELETE") {
    images = images.filter((image) => image.id !== match[1]);
    return success({ id: match[1] });
  }
  if (method === "PUT") {
    const input = body as { url?: string } | null;
    const updated = updateImage(match[1], input?.url ?? "");
    return updated ? success(updated) : failure("NOT_FOUND", "Image not found.", 404);
  }
  return failure("METHOD_NOT_ALLOWED", "Unsupported demo image action.", 405);
}

function handleDiscount<T>(
  method: string,
  path: string,
  body: unknown,
): ApiCallResult<T> {
  const match = path.match(/^\/api\/admin\/discounts\/([^/]+)$/);
  if (!match?.[1]) return failure("NOT_FOUND", "Discount route not found.", 404);
  if (method === "DELETE") {
    discounts = discounts.filter((discount) => discount.id !== match[1]);
    return success({ id: match[1] });
  }
  if (method === "PUT") {
    return success(saveDiscount(match[1], body));
  }
  return failure("METHOD_NOT_ALLOWED", "Unsupported demo discount action.", 405);
}

function orderList(): AdminOrderListItem[] {
  return orders.map(
    ({
      address,
      subtotalPence,
      deliveryFeePence,
      discountPence,
      discountCode,
      estimatedTime,
      ...item
    }) => item,
  );
}

const demoGbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function demoMoney(pence: number): string {
  return demoGbpFormatter.format(Math.trunc(pence) / 100);
}

function demoReference(order: Pick<AdminOrderDetail, "id" | "reference">): string {
  return order.reference ?? order.id.slice(0, 8).toUpperCase();
}

function demoStatus(order: AdminOrderDetail): InvoiceDocumentModel["orderStatus"] {
  if (order.status === "pending_payment") return { label: "Unpaid", tone: "unpaid" };
  if (order.status === "delivered") return { label: "Delivered", tone: "delivered" };
  if (order.status === "cancelled" || order.status === "rejected") {
    return {
      label: order.status === "cancelled" ? "Cancelled" : "Rejected",
      tone: "cancelled",
    };
  }
  return {
    label: order.status.replace(/_/g, " "),
    tone: "in_progress",
  };
}

function demoPaymentStatus(
  order: AdminOrderDetail,
): InvoiceDocumentModel["paymentStatus"] {
  if (order.status === "pending_payment") return { label: "Unpaid", tone: "unpaid" };
  if (order.status === "cancelled" || order.status === "rejected") {
    return { label: "Cancelled", tone: "cancelled" };
  }
  if (order.paymentMethod === "stripe_card") return { label: "Paid", tone: "paid" };
  return { label: "Pay on collection/delivery", tone: "in_progress" };
}

function buildDemoInvoice(order: AdminOrderDetail): InvoiceDocumentModel {
  const reference = demoReference(order);
  const invoiceNumber = `INV-${reference}`;
  return {
    id: order.id,
    invoiceNumber,
    fileName: `invoice-${invoiceNumber}.pdf`,
    orderReference: reference,
    issueDate: new Date(order.createdAt).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    issuedAt: order.createdAt,
    fulfilmentType: order.type === "delivery" ? "Delivery" : "Collection",
    paymentMethod:
      order.paymentMethod === "stripe_card"
        ? "Card (paid online)"
        : "Cash on delivery or collection",
    paymentStatus: demoPaymentStatus(order),
    orderStatus: demoStatus(order),
    business: {
      name: "Margherita Pizzeria",
      shortName: "Margherita",
      email: "hello@margheritapizzeria.co.uk",
      phone: "+44 7746 870341",
      address: "652 Alexandra Parade, Dennistoun, Glasgow, G31 3BU",
      url: "https://www.margheritapizza.uk",
      logoUrl: "https://www.margheritapizza.uk/logo.png",
    },
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.type === "delivery" ? order.address : null,
    },
    items: order.items.map((item, index) => ({
      lineId: `${item.menuItemId}-${index}`,
      name: item.name,
      quantity: item.quantity,
      unitPricePence: item.unitPricePence,
      rowTotalPence: item.totalPence,
      unitPrice: demoMoney(item.unitPricePence),
      rowTotal: demoMoney(item.totalPence),
    })),
    subtotal: {
      key: "subtotal",
      label: "Subtotal",
      amountPence: order.subtotalPence,
      value: demoMoney(order.subtotalPence),
    },
    deliveryFee: {
      key: "delivery",
      label: "Delivery fee",
      amountPence: order.deliveryFeePence,
      value: demoMoney(order.deliveryFeePence),
    },
    discount:
      order.discountPence > 0
        ? {
            key: "discount",
            label: order.discountCode ? `Discount (${order.discountCode})` : "Discount",
            amountPence: order.discountPence,
            value: `-${demoMoney(order.discountPence)}`,
          }
        : null,
    total: {
      key: "total",
      label: "Total",
      amountPence: order.totalPence,
      value: demoMoney(order.totalPence),
    },
    footerMessage: "Thank you for your order.",
  };
}

function bookingList(): AdminBookingListItem[] {
  return bookings.map(({ tableId, ...item }) => item);
}

function buildDashboard(): AdminDashboardStats {
  const latestOrders = orderList();
  const latestBookings = bookingList();
  return {
    todayOrderCount: latestOrders.length,
    todayBookingCount: latestBookings.length,
    todayRevenuePence: latestOrders.reduce((total, order) => total + order.totalPence, 0),
    pendingBookingsCount: latestBookings.filter((booking) => booking.status === "pending").length,
    activeMenuItemsCount: menuItems.filter((item) => item.available).length,
    unavailableMenuItemsCount: menuItems.filter((item) => !item.available).length,
    latestOrders,
    latestBookings,
    generatedAt: now,
  };
}

function updateOrder(id: string, status: OrderStatus): AdminOrderDetail | null {
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index]!, status, updatedAt: now };
  return orders[index]!;
}

function updateBooking(id: string, status: BookingStatus): AdminBookingDetail | null {
  const index = bookings.findIndex((booking) => booking.id === id);
  if (index === -1) return null;
  bookings[index] = { ...bookings[index]!, status, updatedAt: now };
  return bookings[index]!;
}

function saveMenuItem(id: string | null, raw: unknown): AdminMenuItem {
  const input = raw as Partial<AdminMenuItem> | null;
  const existing = id ? menuItems.find((item) => item.id === id) : null;
  const item: AdminMenuItem = {
    id: id ?? `item-demo-${Date.now()}`,
    categoryId: input?.categoryId ?? existing?.categoryId ?? "cat-pizza",
    name: input?.name ?? existing?.name ?? "Demo menu item",
    description: input?.description ?? existing?.description ?? null,
    pricePence: input?.pricePence ?? existing?.pricePence ?? 999,
    imageUrl: input?.imageUrl ?? existing?.imageUrl ?? "",
    available: input?.available ?? existing?.available ?? true,
    allergens: input?.allergens ?? existing?.allergens ?? [],
    createdAt: existing?.createdAt ?? now,
  };
  menuItems = id
    ? menuItems.map((current) => (current.id === id ? item : current))
    : [item, ...menuItems];
  return item;
}

function updateImage(id: string, url: string): AdminImage | null {
  const index = images.findIndex((image) => image.id === id);
  if (index === -1) return null;
  images[index] = { ...images[index]!, url, updatedAt: now };
  return images[index]!;
}

function saveDiscount(id: string | null, raw: unknown): AdminDiscount {
  const input = raw as Partial<AdminDiscount> | null;
  const existing = id ? discounts.find((discount) => discount.id === id) : null;
  const discount: AdminDiscount = {
    id: id ?? `discount-demo-${Date.now()}`,
    code: input?.code ?? existing?.code ?? "DEMO10",
    title: input?.title ?? existing?.title ?? "Demo review discount",
    description: input?.description ?? existing?.description ?? null,
    type: input?.type ?? existing?.type ?? "percentage",
    value: input?.value ?? existing?.value ?? 10,
    minOrderPence: input?.minOrderPence ?? existing?.minOrderPence ?? 1500,
    startsAt: input?.startsAt ?? existing?.startsAt ?? null,
    endsAt: input?.endsAt ?? existing?.endsAt ?? null,
    active: input?.active ?? existing?.active ?? false,
    appliesToDelivery: input?.appliesToDelivery ?? existing?.appliesToDelivery ?? true,
    appliesToCollection: input?.appliesToCollection ?? existing?.appliesToCollection ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  discounts = id
    ? discounts.map((current) => (current.id === id ? discount : current))
    : [discount, ...discounts];
  return discount;
}

function success<T>(data: unknown): ApiCallResult<T> {
  return { ok: true, status: 200, data: data as T, raw: { ok: true, data } };
}

function failure<T>(
  code: string,
  message: string,
  status: number,
): ApiCallResult<T> {
  return { ok: false, status, code, message, raw: { ok: false, error: { code, message } } };
}
