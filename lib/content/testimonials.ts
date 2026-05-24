/**
 * Customer testimonials carried over from margheritapizzeria.co.uk.
 * 4.2★ across Google, Uber Eats and Deliveroo (62+ reviews).
 */

export interface Testimonial {
  id: string;
  name: string;
  source: "GOOGLE" | "DELIVEROO" | "UBER_EATS";
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
}

export const testimonials: ReadonlyArray<Testimonial> = [
  {
    id: "callum-stewart",
    name: "Callum Stewart",
    source: "GOOGLE",
    rating: 5,
    quote:
      "Best pizza in Dennistoun, no competition. The sourdough base is something else entirely. We order every Friday night and it always arrives hot.",
  },
  {
    id: "ayesha-rahman",
    name: "Ayesha Rahman",
    source: "DELIVEROO",
    rating: 5,
    quote:
      "The King Smashburger is the best burger I've had in Glasgow. Proper smash patty, real cheddar, chips were perfectly crispy. Got it twice this week already.",
  },
  {
    id: "liam-morrison",
    name: "Liam Morrison",
    source: "GOOGLE",
    rating: 5,
    quote:
      "Tried the spicy chicken pizza and a shawarma plate. Both were absolutely class. You can taste the difference with real sourdough. Will definitely be back.",
  },
  {
    id: "jamie-mackenzie",
    name: "Jamie Mackenzie",
    source: "DELIVEROO",
    rating: 5,
    quote:
      "Mixed grill was unreal. Three proper skewers, wings, the lot. Easily enough for two people. Best takeaway on Alexandra Parade by a mile.",
  },
  {
    id: "fatima-al-hassan",
    name: "Fatima Al-Hassan",
    source: "GOOGLE",
    rating: 5,
    quote:
      "So happy to have a proper halal pizza place in the East End. The Marinara was incredible, prawns were so fresh. Kids loved the Kids Deal too.",
  },
  {
    id: "priya-singh",
    name: "Priya Singh",
    source: "GOOGLE",
    rating: 5,
    quote:
      "Chicken Alfredo pasta was gorgeous. Rich sauce, really generous portion. Had the stuffed crust Margherita as well. That sourdough dough is 100% worth it.",
  },
  {
    id: "sara-khalid",
    name: "Sara Khalid",
    source: "DELIVEROO",
    rating: 5,
    quote:
      "Ordered the Four Cheese pizza and the Golden Box for a family night. Loads of food for the price. Pizza was fresh and hot out the oven.",
  },
  {
    id: "ryan-mclean",
    name: "Ryan McLean",
    source: "DELIVEROO",
    rating: 5,
    quote:
      "The Bolognese pizza is a winner every time. Ordered it three weeks running now. Stone baked base is way better than any of the chain pizza places. Always fast delivery.",
  },
];

export interface DeliveryZone {
  postcode: string;
  area: string;
  feeLabel: string;
  free: boolean;
}

export const deliveryZones: ReadonlyArray<DeliveryZone> = [
  { postcode: "G31", area: "Dennistoun", feeLabel: "FREE", free: true },
  { postcode: "G4", area: "Gallowgate", feeLabel: "£3.99", free: false },
  { postcode: "G40", area: "Bridgeton", feeLabel: "£3.99", free: false },
  { postcode: "G32", area: "Shettleston", feeLabel: "£3.99", free: false },
  { postcode: "G32", area: "Carntyne", feeLabel: "£3.99", free: false },
  { postcode: "G33", area: "Riddrie", feeLabel: "£3.99", free: false },
  { postcode: "G21", area: "Springburn", feeLabel: "£3.99", free: false },
];
