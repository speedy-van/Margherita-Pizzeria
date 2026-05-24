import { siteConfig } from "@/lib/config/site";

export type FaqCategoryId =
  | "ordering"
  | "delivery"
  | "collection"
  | "booking"
  | "payments"
  | "allergies"
  | "visiting"
  | "tracking";

export interface FaqCategory {
  id: FaqCategoryId;
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  category: FaqCategoryId;
  question: string;
  answer: string;
}

export const faqCategories: FaqCategory[] = [
  { id: "ordering", title: "Ordering", description: "Placing and changing an order." },
  { id: "delivery", title: "Delivery", description: "Where we deliver and what to expect." },
  { id: "collection", title: "Collection", description: "Picking up from the restaurant." },
  { id: "booking", title: "Table booking", description: "Booking a table in our dining room." },
  { id: "payments", title: "Payments", description: "How and when you pay." },
  { id: "allergies", title: "Allergies & dietary needs", description: "Allergens, vegan and vegetarian options." },
  { id: "visiting", title: "Opening times & visiting", description: "When we're open and what to expect on the night." },
  { id: "tracking", title: "Tracking & support", description: "Following your order and getting help." },
];

export const faqItems: FaqItem[] = [
  // ─── Ordering ────────────────────────────────────────────────
  {
    id: "ord-1",
    category: "ordering",
    question: "How do I place an order?",
    answer:
      "Head to the order page, pick delivery or collection, choose your pizzas, add your details and pay. The whole thing takes a minute or two.",
  },
  {
    id: "ord-2",
    category: "ordering",
    question: "Can I change my order after placing it?",
    answer:
      "Once an order is in the kitchen we can't always change it, but it's worth asking quickly via the contact page — we'll do what we can if it hasn't been started.",
  },
  {
    id: "ord-3",
    category: "ordering",
    question: "What happens if an item is unavailable?",
    answer:
      "If a topping or item runs out we'll get in touch as soon as we can to offer the closest alternative or a refund on that item.",
  },
  {
    id: "ord-4",
    category: "ordering",
    question: "Is there a minimum order?",
    answer:
      "There's a small minimum on delivery to make sure your pizza arrives in good shape. The current minimum is shown at checkout before you pay.",
  },
  {
    id: "ord-5",
    category: "ordering",
    question: "Can I order for a big group or party?",
    answer:
      "Yes — please use the contact form with the date, time and rough numbers and we'll come back with what we can do.",
  },

  // ─── Delivery ─────────────────────────────────────────────────
  {
    id: "del-1",
    category: "delivery",
    question: "Where do you deliver?",
    answer: `We deliver across the East End and surrounding areas — anywhere within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}. The address checker on the order page will confirm if you're in zone.`,
  },
  {
    id: "del-2",
    category: "delivery",
    question: "How far do you deliver?",
    answer: `Our delivery zone is a ${siteConfig.deliveryRadiusMiles}-mile radius from ${siteConfig.postcode}. If you're just outside the line, get in touch — we sometimes have flexibility for the right slot.`,
  },
  {
    id: "del-3",
    category: "delivery",
    question: "What if my address is outside the delivery area?",
    answer:
      "Order checkout will flag it before you pay. You're always welcome to collect from the restaurant instead.",
  },
  {
    id: "del-4",
    category: "delivery",
    question: "How much is delivery?",
    answer:
      "The live delivery fee is shown at checkout. We keep it deliberately low to cover the driver and packaging, not as a profit centre.",
  },
  {
    id: "del-5",
    category: "delivery",
    question: "How long will my delivery take?",
    answer:
      "Most deliveries land within roughly 30–45 minutes from confirmation. Busy Friday and Saturday nights can take a little longer — your tracking page will show a live estimate.",
  },
  {
    id: "del-6",
    category: "delivery",
    question: "Can I tip the driver?",
    answer:
      "Tips are appreciated but absolutely never expected. Cash on the door or a thank-you both go a long way.",
  },

  // ─── Collection ───────────────────────────────────────────────
  {
    id: "col-1",
    category: "collection",
    question: "Can I collect my order?",
    answer: `Yes. Collection is from ${siteConfig.address}. Choose a collection time at checkout and we'll have it boxed and ready.`,
  },
  {
    id: "col-2",
    category: "collection",
    question: "Can I collect as soon as possible?",
    answer:
      "Yes — pick the earliest available slot at checkout and we'll get straight on it. We'll tell you how long the wait is before you confirm.",
  },
  {
    id: "col-3",
    category: "collection",
    question: "Can I schedule collection for later?",
    answer:
      "Yes, pick any future time slot we're open for. The order page will only show slots we can actually hit.",
  },

  // ─── Table booking ────────────────────────────────────────────
  {
    id: "bk-1",
    category: "booking",
    question: "How do I book a table?",
    answer:
      "Use the book page, pick a date, number of covers and time slot, then add your details. You'll get a confirmation email shortly after.",
  },
  {
    id: "bk-2",
    category: "booking",
    question: "How many tables do you have?",
    answer: `We have ${siteConfig.tablesCount} tables. Because the room is small, we'd really recommend booking ahead — especially on weekends.`,
  },
  {
    id: "bk-3",
    category: "booking",
    question: "Is there a deposit?",
    answer:
      "Sometimes — usually for larger groups or peak slots. If a deposit is required, you'll see it clearly at booking and it comes off your bill on the night.",
  },
  {
    id: "bk-4",
    category: "booking",
    question: "How do I cancel or change my booking?",
    answer:
      "Drop us a message on the contact page with your booking reference and we'll sort it. The earlier you let us know, the better.",
  },
  {
    id: "bk-5",
    category: "booking",
    question: "Can I book for a large group?",
    answer:
      "Get in touch via the contact form with your date, time and group size. We'll come back to confirm what's possible.",
  },

  // ─── Payments ─────────────────────────────────────────────────
  {
    id: "pay-1",
    category: "payments",
    question: "How do I pay?",
    answer:
      "Online orders are paid by card at checkout. In the restaurant we take card on the night.",
  },
  {
    id: "pay-2",
    category: "payments",
    question: "Is online payment secure?",
    answer:
      "Yes. Card payments are processed by Stripe — your card details never touch our servers. You'll see Stripe's secure checkout when you pay.",
  },
  {
    id: "pay-3",
    category: "payments",
    question: "Can I pay cash on delivery?",
    answer:
      "Online orders are pre-paid by card to keep things smooth for the driver. If you'd really prefer cash, please collect from the restaurant.",
  },
  {
    id: "pay-4",
    category: "payments",
    question: "What if my card payment fails?",
    answer:
      "You'll see a clear error and your order won't be placed. Just try again — sometimes it's a one-off issue with the bank. If it keeps failing, contact your card provider.",
  },
  {
    id: "pay-5",
    category: "payments",
    question: "What if I cancel the Stripe payment screen?",
    answer:
      "Nothing is charged and no order is placed. You're free to start again whenever you're ready.",
  },
  {
    id: "pay-6",
    category: "payments",
    question: "Do you offer refunds?",
    answer:
      "If something has genuinely gone wrong — wrong order, missing item, food not up to standard — please get in touch via the contact page and we'll always look at it fairly.",
  },

  // ─── Allergies ────────────────────────────────────────────────
  {
    id: "all-1",
    category: "allergies",
    question: "Where can I see allergen information?",
    answer:
      "Each menu item shows the major allergens we're aware of. If you have a severe allergy, please contact us before ordering so we can talk you through cross-contact risks.",
  },
  {
    id: "all-2",
    category: "allergies",
    question: "Do you have vegetarian options?",
    answer:
      "Yes — there's a vegetarian filter on the menu and the dining room menu marks every veggie option clearly.",
  },
  {
    id: "all-3",
    category: "allergies",
    question: "Do you have vegan options?",
    answer:
      "Yes — vegan cheese is available on most pizzas. Filter by vegan on the menu page to see what's currently on.",
  },
  {
    id: "all-4",
    category: "allergies",
    question: "Do you have gluten-free pizza?",
    answer:
      "If gluten-free bases are currently available, you'll see them on the menu. Because our kitchen handles wheat, we cannot guarantee a totally gluten-free environment — please contact us first if you're coeliac.",
  },

  // ─── Opening times & visiting ─────────────────────────────────
  {
    id: "vis-1",
    category: "visiting",
    question: "What are your opening hours?",
    answer:
      "Hours are kept up to date on the order page and on Google. Please check live opening times before you set off, as we adjust hours for holidays and the occasional staff night.",
  },
  {
    id: "vis-2",
    category: "visiting",
    question: "Are you open late?",
    answer:
      "We trade into the evening. The order page is the most accurate source for tonight's last orders — slots close as the kitchen winds down.",
  },
  {
    id: "vis-3",
    category: "visiting",
    question: "Is there parking?",
    answer:
      "Alexandra Parade has on-street parking and there are usually quiet side streets nearby, but availability can change with the time of day. We can't promise a space.",
  },
  {
    id: "vis-4",
    category: "visiting",
    question: "How do I get to you?",
    answer:
      "See the directions page for routes from the city centre, Dennistoun, Parkhead and Bridgeton, plus public-transport pointers.",
  },
  {
    id: "vis-5",
    category: "visiting",
    question: "Is it family-friendly?",
    answer:
      "Absolutely — kids are very welcome at dinner-time. The dining room is small so a quick heads-up if you're bringing a buggy is helpful.",
  },

  // ─── Tracking & support ───────────────────────────────────────
  {
    id: "trk-1",
    category: "tracking",
    question: "How do I track my order?",
    answer:
      "After you order, you'll get a tracking link that updates as the order is accepted, in the oven, out for delivery and delivered.",
  },
  {
    id: "trk-2",
    category: "tracking",
    question: "Can I see where the driver is?",
    answer:
      "On delivery orders, once the driver is on the road you'll be able to see their progress on the tracking map.",
  },
  {
    id: "trk-3",
    category: "tracking",
    question: "How is my personal data handled?",
    answer:
      "We only use your details to fulfil your order and contact you about it. We don't sell your data, and we keep what we hold to a minimum.",
  },
  {
    id: "trk-4",
    category: "tracking",
    question: "Something went wrong — who do I contact?",
    answer:
      "Use the contact page. Include your order number if you have one and we'll come back to you as quickly as we can.",
  },
];
