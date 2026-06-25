/**
 * Generate the production QR code for the Margherita Pizzeria menu/order page.
 *
 * Usage:
 *   npx tsx scripts/generate-qr.ts            # defaults to /order on production domain
 *   npx tsx scripts/generate-qr.ts /menu      # override path
 *   TARGET_URL=https://example.com npx tsx scripts/generate-qr.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import QRCode from "qrcode";

const DEFAULT_BASE = "https://margheritapizza.uk";
const DEFAULT_PATH = "/order";

async function main() {
  const pathArg = process.argv[2] ?? DEFAULT_PATH;
  const target =
    process.env.TARGET_URL ??
    `${DEFAULT_BASE}${pathArg.startsWith("/") ? pathArg : `/${pathArg}`}`;

  const outDir = resolve(process.cwd(), "public", "qr");
  await mkdir(outDir, { recursive: true });

  const baseName = pathArg.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "home";

  const commonOpts = {
    errorCorrectionLevel: "H" as const, // 30% – survives logo overlay & print smudges
    margin: 2,
    color: { dark: "#0D0D0D", light: "#FFFFFF" },
  };

  const svgPath = resolve(outDir, `${baseName}.svg`);
  const pngPath = resolve(outDir, `${baseName}.png`);

  const svg = await QRCode.toString(target, { ...commonOpts, type: "svg" });
  await writeFile(svgPath, svg, "utf8");

  await QRCode.toFile(pngPath, target, {
    ...commonOpts,
    type: "png",
    width: 1024, // 1024px – sharp for A4/A5 print
  });

  console.log(`QR generated for: ${target}`);
  console.log(`  SVG: ${svgPath}`);
  console.log(`  PNG: ${pngPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
