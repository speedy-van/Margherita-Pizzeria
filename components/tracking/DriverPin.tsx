"use client";

import { brandColors } from "@/lib/config/site";

function pinHTML(opts: {
  bg: string;
  label: string;
  title: string;
  ariaLabel: string;
}): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", opts.ariaLabel);
  el.setAttribute("title", opts.title);
  el.style.width = "32px";
  el.style.height = "32px";
  el.style.borderRadius = "9999px";
  el.style.background = opts.bg;
  el.style.border = "3px solid #FFFFFF";
  el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "#FFFFFF";
  el.style.fontFamily =
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  el.style.fontSize = "14px";
  el.style.fontWeight = "700";
  el.style.lineHeight = "1";
  el.style.userSelect = "none";
  el.style.cursor = "default";
  el.textContent = opts.label;
  return el;
}

export function createDriverPinElement(): HTMLElement {
  return pinHTML({
    bg: brandColors.amber,
    label: "D",
    title: "Driver location",
    ariaLabel: "Driver location",
  });
}

export function createDestinationPinElement(): HTMLElement {
  return pinHTML({
    bg: brandColors.crimson,
    label: "H",
    title: "Delivery address",
    ariaLabel: "Delivery destination",
  });
}
