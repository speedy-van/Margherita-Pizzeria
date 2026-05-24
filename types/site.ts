import type { Route } from "next";

export interface NavItem {
  label: string;
  href: Route | string;
  external?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: NavItem[];
}

export interface BusinessHour {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface SeoPageConfig {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
  /** Optional list of SEO keywords (used naturally, no stuffing). */
  keywords?: readonly string[];
}
