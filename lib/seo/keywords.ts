/**
 * Keyword targeting for Margherita Pizzeria's Glasgow SEO.
 *
 * Used for naturally weaving terms into metadata `keywords` arrays. NOT a
 * doorway-page generator: we do not produce per-keyword landing pages.
 */

export const primaryKeywords: readonly string[] = [
  "pizza delivery Glasgow",
  "pizza near me Glasgow",
  "pizza Alexandra Parade",
  "pizza delivery G31",
  "pizza collection Glasgow",
  "pizza collection G31",
  "pizza Dennistoun",
  "pizza Parkhead",
  "pizza Bridgeton",
  "pizza East End Glasgow",
  "evening pizza delivery Glasgow",
  "sourdough pizza Glasgow",
  "halal pizza Glasgow",
  "halal takeaway Dennistoun",
  "stone baked pizza Glasgow",
  "kebab Dennistoun",
  "shawarma Glasgow",
  "smashburger Glasgow",
  "pizza restaurant Glasgow",
  "table booking pizza Glasgow",
  "pizza dine in Glasgow",
] as const;

export const pageKeywordMap = {
  "/": [
    "sourdough pizza Glasgow",
    "pizza restaurant Glasgow",
    "pizza delivery Glasgow",
    "pizza near me Glasgow",
    "pizza Alexandra Parade",
    "pizza East End Glasgow",
  ],
  "/menu": [
    "pizza menu Glasgow",
    "sourdough pizza Glasgow",
    "pizza delivery Glasgow",
    "pizza collection Glasgow",
    "pizza Alexandra Parade",
  ],
  "/order": [
    "order pizza online Glasgow",
    "pizza delivery Glasgow",
    "pizza collection Glasgow",
    "pizza delivery G31",
    "pizza collection G31",
    "pizza Dennistoun",
    "pizza Parkhead",
    "pizza Bridgeton",
  ],
  "/book": [
    "book table pizza Glasgow",
    "table booking pizza Glasgow",
    "pizza dine in Glasgow",
    "pizza restaurant Glasgow",
    "pizza Alexandra Parade",
  ],
  "/about": [
    "pizza restaurant Glasgow",
    "sourdough pizza Glasgow",
    "pizza Alexandra Parade",
    "pizza East End Glasgow",
  ],
  "/faq": [
    "pizza delivery Glasgow",
    "pizza collection Glasgow",
    "table booking pizza Glasgow",
    "pizza delivery G31",
  ],
  "/directions": [
    "pizza Alexandra Parade",
    "pizza Dennistoun",
    "pizza East End Glasgow",
    "pizza restaurant Glasgow",
  ],
  "/contact": [
    "contact pizza restaurant Glasgow",
    "pizza Alexandra Parade",
    "pizza delivery Glasgow",
  ],
} as const satisfies Record<string, readonly string[]>;

export type KeywordPath = keyof typeof pageKeywordMap;

export function getKeywordsForPath(path: string): readonly string[] {
  if (path in pageKeywordMap) {
    return pageKeywordMap[path as KeywordPath];
  }
  return primaryKeywords;
}
