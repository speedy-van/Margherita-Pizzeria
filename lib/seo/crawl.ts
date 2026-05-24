import { noIndexRoutes, publicSeoRoutes } from "@/lib/seo/routes";

/**
 * Lightweight crawl-sanity helpers used by sitemap/robots logic and tests.
 * Pure functions only — no I/O, no runtime dependencies.
 */

function normalisePath(path: string): string {
  if (!path) return "/";
  const noQuery = path.split("?")[0]?.split("#")[0] ?? path;
  if (noQuery.length > 1 && noQuery.endsWith("/")) {
    return noQuery.replace(/\/+$/, "");
  }
  return noQuery;
}

export function isIndexablePath(path: string): boolean {
  const p = normalisePath(path);
  for (const prefix of noIndexRoutes) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return false;
  }
  return publicSeoRoutes.some((r) => r.path === p);
}

export function shouldShowCanonical(path: string): boolean {
  // We always emit a canonical for indexable pages. We also emit one for
  // non-indexable pages so search engines collapse parameter variants, but
  // those pages additionally set `robots: noindex`.
  return normalisePath(path).length > 0;
}
