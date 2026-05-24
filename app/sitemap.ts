import type { MetadataRoute } from "next";

import { getCanonicalUrl, publicSeoRoutes } from "@/lib/seo/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return publicSeoRoutes.map((route) => ({
    url: getCanonicalUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
