import { restaurantLocation, siteConfig } from "@/lib/config/site";

export interface DirectionsRoute {
  id: string;
  origin: string;
  driving: string;
  walkingOrTransit: string;
  approxMinutes: string;
}

export interface ParkingTip {
  id: string;
  title: string;
  body: string;
}

export interface TransportTip {
  id: string;
  title: string;
  body: string;
}

export interface DirectionsContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  address: {
    line: string;
    city: string;
    postcode: string;
    country: string;
    full: string;
  };
  mapSearchUrl: string;
  routes: DirectionsRoute[];
  parking: ParkingTip[];
  transport: TransportTip[];
}

const fullAddressEncoded = encodeURIComponent(siteConfig.address);

export const directionsContent: DirectionsContent = {
  hero: {
    eyebrow: "Find us",
    title: "How to get to the restaurant.",
    description: `${siteConfig.name} sits on Alexandra Parade in Glasgow's East End — easy to reach from the city centre, Dennistoun, Parkhead and Bridgeton by car, on foot or by public transport.`,
  },
  address: {
    line: restaurantLocation.addressLine,
    city: restaurantLocation.city,
    postcode: restaurantLocation.postcode,
    country: "United Kingdom",
    full: siteConfig.address,
  },
  mapSearchUrl: `https://www.google.com/maps/search/?api=1&query=${fullAddressEncoded}`,
  routes: [
    {
      id: "city-centre",
      origin: "From Glasgow City Centre",
      driving:
        "Head east on Duke Street or take the M8 east to Junction 15 (Townhead) and follow signs for Alexandra Parade. The restaurant is on the south side of the road.",
      walkingOrTransit:
        "Several east-bound buses serve Alexandra Parade from the city centre — check live bus times before travelling. The walk from the centre is a brisk 30–35 minutes via Duke Street.",
      approxMinutes: "10–15 mins by car · ~30 mins walk",
    },
    {
      id: "dennistoun",
      origin: "From Dennistoun",
      driving:
        "From Duke Street or Alexandra Parade, you're a short hop east. There's no motorway involved — most journeys are a straight run along the parade.",
      walkingOrTransit:
        "Walkable from most of Dennistoun in 10–15 minutes. Local east-bound buses along Alexandra Parade also stop nearby — check live bus times.",
      approxMinutes: "5 mins by car · 10–15 mins walk",
    },
    {
      id: "parkhead",
      origin: "From Parkhead",
      driving:
        "Head north onto Westmuir Street / Duke Street, then turn onto Alexandra Parade. Watch for school-time traffic around the Forge area.",
      walkingOrTransit:
        "Buses linking Parkhead with Alexandra Parade run regularly — please check live bus times before travelling.",
      approxMinutes: "8–12 mins by car",
    },
    {
      id: "bridgeton",
      origin: "From Bridgeton",
      driving:
        "Head north past Bellgrove and onto Alexandra Parade. Most of the journey is along main roads with bus lanes — allow extra time at peak periods.",
      walkingOrTransit:
        "Bellgrove rail station is the nearest mainline station; from there it's a short bus or taxi up to Alexandra Parade. Check live bus and train times before travelling.",
      approxMinutes: "10–15 mins by car",
    },
  ],
  parking: [
    {
      id: "street",
      title: "On-street parking",
      body: "Alexandra Parade and its side streets typically offer on-street parking, but availability varies through the day. We can't guarantee a space, so allow a few extra minutes at peak times.",
    },
    {
      id: "restrictions",
      title: "Check signage",
      body: "Always check the signage on the bay before you park — some streets have residents-only restrictions at certain times.",
    },
    {
      id: "accessibility",
      title: "Drop-offs",
      body: "If you're picking up a collection order, the kerb directly outside is fine for a quick stop — please don't block bus stops or driveways.",
    },
  ],
  transport: [
    {
      id: "bus",
      title: "By bus",
      body: "Several services run along Alexandra Parade and Duke Street. We don't list specific service numbers here because they change — please check live bus times with First Bus or your maps app.",
    },
    {
      id: "train",
      title: "By train",
      body: "Bellgrove and Alexandra Parade rail stations are the nearest options. From either it's a short walk or local bus to the restaurant.",
    },
    {
      id: "walk-cycle",
      title: "On foot or by bike",
      body: "We're walkable from Dennistoun in under 15 minutes and from the city centre in around half an hour. The route along Duke Street and Alexandra Parade has cycle infrastructure in most stretches.",
    },
    {
      id: "taxi",
      title: "By taxi or ride-share",
      body: `Drop-off is straight outside ${siteConfig.address}. Black cabs and ride-share apps both serve the East End.`,
    },
  ],
};
