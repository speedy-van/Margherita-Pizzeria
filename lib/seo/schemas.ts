import { restaurantLocation, siteConfig } from "@/lib/config/site";
import type { FaqItem } from "@/lib/content/faq";
import type { PublicMenuResponse } from "@/lib/menu/types";
import { getCanonicalUrl } from "@/lib/seo/routes";

/**
 * Schema.org JSON-LD builders. Each returns a plain JSON-serialisable object
 * suitable for embedding inside a `<script type="application/ld+json">` tag.
 *
 * Rules:
 *  - Only use facts confirmed by the brief.
 *  - No telephone, no geo coordinates, no opening hours, no fake reviews.
 *  - Aggregate rating uses the confirmed Google figures (4.9 / 74).
 */

export type JsonLdObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  path: string;
}

function buildAddress(): JsonLdObject {
  return {
    "@type": "PostalAddress",
    streetAddress: restaurantLocation.addressLine,
    addressLocality: restaurantLocation.city,
    postalCode: restaurantLocation.postcode,
    addressCountry: restaurantLocation.country,
  };
}

function buildAggregateRating(): JsonLdObject {
  return {
    "@type": "AggregateRating",
    ratingValue: siteConfig.rating,
    reviewCount: siteConfig.reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}

function buildAreaServed(): JsonLdObject[] {
  return [
    { "@type": "City", name: "Glasgow" },
    {
      "@type": "GeoCircle",
      description: `${siteConfig.deliveryRadiusMiles}-mile delivery radius from ${siteConfig.postcode}`,
      geoMidpoint: {
        "@type": "Place",
        address: buildAddress(),
      },
    },
  ];
}

export function buildRestaurantSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${getCanonicalUrl("/")}#restaurant`,
    name: siteConfig.name,
    url: getCanonicalUrl("/"),
    description: siteConfig.description,
    servesCuisine: siteConfig.servesCuisine,
    priceRange: siteConfig.priceRange,
    currenciesAccepted: siteConfig.currency,
    paymentAccepted: "Cash, Credit Card",
    address: buildAddress(),
    areaServed: buildAreaServed(),
    aggregateRating: buildAggregateRating(),
    hasMenu: getCanonicalUrl("/menu"),
    acceptsReservations: true,
  };
}

export function buildLocalBusinessSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${getCanonicalUrl("/")}#localbusiness`,
    name: siteConfig.name,
    url: getCanonicalUrl("/"),
    description: siteConfig.description,
    priceRange: siteConfig.priceRange,
    currenciesAccepted: siteConfig.currency,
    address: buildAddress(),
    areaServed: buildAreaServed(),
    aggregateRating: buildAggregateRating(),
  };
}

export function buildWebSiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getCanonicalUrl("/")}#website`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: getCanonicalUrl("/"),
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: getCanonicalUrl("/"),
    },
  };
}

export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function buildMenuSchema(
  menu: Pick<PublicMenuResponse, "categories">,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${siteConfig.name} menu`,
    url: getCanonicalUrl("/menu"),
    inLanguage: "en-GB",
    hasMenuSection: menu.categories
      .filter((cat) => cat.active && cat.items.length > 0)
      .map((cat) => ({
        "@type": "MenuSection",
        name: cat.name,
        hasMenuItem: cat.items.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          offers: {
            "@type": "Offer",
            price: (item.pricePence / 100).toFixed(2),
            priceCurrency: siteConfig.currency,
            availability: item.available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        })),
      })),
  };
}

export function buildFaqSchema(faqs: readonly FaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildContactPageSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${siteConfig.name}`,
    url: getCanonicalUrl("/contact"),
    inLanguage: "en-GB",
    about: {
      "@type": "Restaurant",
      name: siteConfig.name,
      address: buildAddress(),
    },
  };
}

export function buildDirectionsPageSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: siteConfig.name,
    url: getCanonicalUrl("/directions"),
    address: buildAddress(),
    areaServed: buildAreaServed(),
  };
}
