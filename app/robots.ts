import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";
import { getCanonicalUrl } from "@/lib/seo/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/order/success",
          "/book/success",
          "/track",
          "/track/",
          "/lp",
          "/lp/",
        ],
      },
    ],
    sitemap: `${getCanonicalUrl("/")}sitemap.xml`,
    host: siteConfig.url.replace(/\/+$/, ""),
  };
}
