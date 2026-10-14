import type { DishMeta } from "@/lib/menu/dish-classifier";

/**
 * Render an on-brand SVG "dish card" for a given menu item.
 * The output is deterministic from the name (stable PRNG) so the same
 * item always looks the same across reloads / devices.
 *
 * Card layout:
 *   - 1200×900 wood-table background with brand gradient + grain
 *   - Centred illustrated dish appropriate to the classified kind
 *   - Eyebrow category + item name typography
 *   - Margherita Pizzeria wordmark + halal badge bottom-left
 *
 * Important: every drawing primitive uses inline SVG (no external assets),
 * which means the response is self-contained and ~6–12 KB.
 */

interface RenderOpts {
  name: string;
  meta: DishMeta;
}

const W = 1200;
const H = 900;

/** Deterministic 32-bit PRNG seeded from a string. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─────────── primitive: pizza disc with sauce + toppings ───────────

interface PizzaSpec {
  sauce: string;
  cheese: boolean;
  basil: boolean;
  pepperoni: boolean;
  pineapple: boolean;
  veg: boolean;
  olive: boolean;
  meat: boolean;
  seafood: boolean;
  bbq: boolean;
  extraCheese: boolean;
}

function pizzaSpecFor(kind: DishMeta["kind"]): PizzaSpec {
  const base: PizzaSpec = {
    sauce: "#C0392B",
    cheese: true,
    basil: false,
    pepperoni: false,
    pineapple: false,
    veg: false,
    olive: false,
    meat: false,
    seafood: false,
    bbq: false,
    extraCheese: false,
  };
  switch (kind) {
    case "pizza-margherita":
      return { ...base, basil: true };
    case "pizza-pepperoni":
      return { ...base, pepperoni: true };
    case "pizza-hawaiian":
      return { ...base, pineapple: true, meat: true };
    case "pizza-veggie":
      return { ...base, veg: true, olive: true, basil: true };
    case "pizza-bbq":
      return { ...base, bbq: true, meat: true, sauce: "#7A2A14" };
    case "pizza-cheese":
      return { ...base, extraCheese: true, sauce: "#E8D9B4" };
    case "pizza-seafood":
      return { ...base, seafood: true, basil: true };
    case "pizza-meat":
      return { ...base, meat: true, pepperoni: true };
    case "pizza-generic":
    default:
      return { ...base, pepperoni: true, basil: true };
  }
}

function drawPizza(name: string, spec: PizzaSpec): string {
  const cx = W / 2;
  const cy = H / 2 + 30;
  const R = 320;
  const rnd = mulberry32(hashString(name));

  // crust ring (sourdough)
  const crust = `
    <defs>
      <radialGradient id="crust-${name.length}" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#F2D29B"/>
        <stop offset="70%" stop-color="#C99757"/>
        <stop offset="100%" stop-color="#6C3F1B"/>
      </radialGradient>
      <radialGradient id="sauce-${name.length}" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${spec.sauce}"/>
        <stop offset="100%" stop-color="#7A1D12"/>
      </radialGradient>
      <radialGradient id="cheese-${name.length}" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#FFF3C4"/>
        <stop offset="100%" stop-color="#E8B864"/>
      </radialGradient>
      <filter id="oven-${name.length}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${R + 14}" fill="url(#crust-${name.length})"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 8}" fill="url(#sauce-${name.length})"/>
  `;

  // cheese blobs
  const cheese = spec.cheese
    ? Array.from({ length: 22 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 40);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        const rr = 22 + rnd() * 18;
        const op = 0.85 + rnd() * 0.15;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * 0.78).toFixed(1)}" fill="url(#cheese-${name.length})" opacity="${op.toFixed(2)}" filter="url(#oven-${name.length})"/>`;
      }).join("")
    : "";

  // extra cheese flood for 4-cheese
  const extraCheese = spec.extraCheese
    ? `<circle cx="${cx}" cy="${cy}" r="${R - 18}" fill="url(#cheese-${name.length})" opacity="0.85"/>`
    : "";

  // pepperoni
  const pepperoni = spec.pepperoni
    ? Array.from({ length: 10 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 70);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="32" fill="#9B1B14"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="28" fill="#C0392B"/><circle cx="${(x - 8).toFixed(1)}" cy="${(y - 6).toFixed(1)}" r="4" fill="#7A1D12"/><circle cx="${(x + 9).toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="3" fill="#7A1D12"/></g>`;
      }).join("")
    : "";

  // basil leaves
  const basil = spec.basil
    ? Array.from({ length: 7 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 60);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        const rot = (rnd() * 360).toFixed(0);
        return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})"><path d="M0,-22 C 16,-18 16,18 0,22 C -16,18 -16,-18 0,-22 Z" fill="#2F7A33"/><path d="M0,-22 L0,22" stroke="#1F5523" stroke-width="1.8"/></g>`;
      }).join("")
    : "";

  // pineapple
  const pineapple = spec.pineapple
    ? Array.from({ length: 8 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 50);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        return `<rect x="${(x - 14).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="28" height="28" rx="6" fill="#F2C744" stroke="#B58E1A" stroke-width="1.5"/>`;
      }).join("")
    : "";

  // veg (peppers, mushroom, onion)
  const veg = spec.veg
    ? Array.from({ length: 14 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 50);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        const kind = Math.floor(rnd() * 3);
        if (kind === 0) {
          // green pepper
          return `<path d="M${x - 18} ${y} q9,-14 18,0 q-9,12 -18,0 Z" fill="#3E8E55"/>`;
        }
        if (kind === 1) {
          // mushroom slice
          return `<g><ellipse cx="${x}" cy="${y}" rx="16" ry="9" fill="#E8DDC4"/><rect x="${x - 4}" y="${y - 2}" width="8" height="9" fill="#C9B98F"/></g>`;
        }
        // red onion ring
        return `<g><circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#8E4FB4" stroke-width="3"/><circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#8E4FB4" stroke-width="2"/></g>`;
      }).join("")
    : "";

  // olives
  const olive = spec.olive
    ? Array.from({ length: 6 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 50);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        return `<g><circle cx="${x}" cy="${y}" r="9" fill="#1B1B1B"/><circle cx="${x}" cy="${y}" r="3" fill="#5A4A2E"/></g>`;
      }).join("")
    : "";

  // shaved meat (donner / bbq chicken)
  const meat = spec.meat
    ? Array.from({ length: 10 }, () => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 60);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        const w = 22 + rnd() * 14;
        const h = 10 + rnd() * 6;
        const rot = (rnd() * 360).toFixed(0);
        const col = spec.bbq ? "#7A3A1D" : "#8B4A24";
        return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})"><rect x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${col}"/></g>`;
      }).join("")
    : "";

  // seafood (prawns + ring squid)
  const seafood = spec.seafood
    ? Array.from({ length: 6 }, (_, i) => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * (R - 60);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (i % 2 === 0) {
          // prawn (curve)
          return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(rnd() * 360).toFixed(0)})"><path d="M -18 0 q 9 -18 18 0 q 9 18 18 0" stroke="#E27A4A" stroke-width="8" fill="none" stroke-linecap="round"/></g>`;
        }
        // calamari ring
        return `<g><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#F2DFC2" stroke-width="3"/></g>`;
      }).join("")
    : "";

  // gentle char spots on crust
  const char = Array.from({ length: 14 }, () => {
    const ang = rnd() * Math.PI * 2;
    const x = cx + Math.cos(ang) * (R + 4);
    const y = cy + Math.sin(ang) * (R + 4);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + rnd() * 3).toFixed(1)}" fill="#3A1F0E" opacity="0.6"/>`;
  }).join("");

  return crust + extraCheese + cheese + char + olive + veg + meat + seafood + pepperoni + pineapple + basil;
}

// ─────────── primitive: burger ───────────

function drawBurger(name: string): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  const w = 540;
  const layer = (dy: number, h: number, fill: string, r = 0) =>
    `<rect x="${cx - w / 2}" y="${cy + dy}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  return `
    <ellipse cx="${cx}" cy="${cy - 170}" rx="${w / 2 + 6}" ry="120" fill="#E0A965"/>
    <ellipse cx="${cx}" cy="${cy - 200}" rx="${w / 2 - 30}" ry="20" fill="#F2D29B" opacity="0.6"/>
    ${Array.from({ length: 14 })
      .map((_, i) => {
        const x = cx - w / 2 + 40 + i * 35;
        const y = cy - 230 + Math.sin(i) * 6;
        return `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#FFFFFF" opacity="0.85"/>`;
      })
      .join("")}
    ${layer(-60, 22, "#3E8E55", 8)}
    ${layer(-40, 24, "#E8B864", 4)}
    ${layer(-18, 40, "#7A2A14", 6)}
    ${layer(20, 14, "#C0392B", 4)}
    ${layer(34, 22, "#3E8E55", 6)}
    <ellipse cx="${cx}" cy="${cy + 80}" rx="${w / 2 + 6}" ry="90" fill="#C99757"/>
  `;
}

// ─────────── primitive: wrap ───────────

function drawWrap(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <g transform="translate(${cx} ${cy}) rotate(-18)">
      <rect x="-300" y="-110" width="600" height="220" rx="80" fill="#E8C893"/>
      <rect x="-300" y="-110" width="600" height="40" rx="40" fill="#D5A463" opacity="0.7"/>
      <rect x="-260" y="-60" width="520" height="30" rx="8" fill="#7A2A14"/>
      <rect x="-260" y="-30" width="520" height="20" rx="6" fill="#3E8E55"/>
      <rect x="-260" y="-10" width="520" height="14" rx="5" fill="#FFF3C4"/>
      <rect x="-300" y="70" width="600" height="40" rx="40" fill="#C99757"/>
    </g>
  `;
}

// ─────────── primitive: hoagie / sub ───────────

function drawHoagie(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <g transform="translate(${cx} ${cy}) rotate(-12)">
      <rect x="-360" y="-90" width="720" height="180" rx="90" fill="#E0A965"/>
      <rect x="-340" y="-80" width="680" height="60" rx="30" fill="#F2D29B" opacity="0.8"/>
      <rect x="-320" y="-20" width="640" height="36" rx="8" fill="#3E8E55"/>
      <rect x="-320" y="16" width="640" height="22" rx="6" fill="#7A2A14"/>
      <rect x="-320" y="38" width="640" height="22" rx="6" fill="#E8B864"/>
    </g>
  `;
}

// ─────────── primitive: kebab skewer ───────────

function drawKebab(name: string): string {
  const cx = W / 2;
  const cy = H / 2 + 60;
  const rnd = mulberry32(hashString(name));
  return `
    <g transform="translate(${cx} ${cy}) rotate(-14)">
      <rect x="-380" y="-12" width="760" height="6" fill="#9B7B3C"/>
      ${Array.from({ length: 6 })
        .map((_, i) => {
          const x = -300 + i * 120;
          const w = 90 + rnd() * 14;
          const h = 70 + rnd() * 10;
          const col = i % 2 === 0 ? "#7A2A14" : "#C0392B";
          return `<rect x="${x - w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="${col}"/>`;
        })
        .join("")}
      ${Array.from({ length: 5 })
        .map((_, i) => {
          const x = -240 + i * 120;
          return `<rect x="${x - 18}" y="-22" width="36" height="44" rx="6" fill="#3E8E55"/>`;
        })
        .join("")}
    </g>
  `;
}

// ─────────── primitive: chicken plate ───────────

function drawChicken(name: string): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  const rnd = mulberry32(hashString(name));
  return `
    <ellipse cx="${cx}" cy="${cy + 40}" rx="380" ry="60" fill="#1f1f1f" opacity="0.35"/>
    <ellipse cx="${cx}" cy="${cy}" rx="360" ry="220" fill="#F2EAD8"/>
    <ellipse cx="${cx}" cy="${cy}" rx="320" ry="190" fill="#FFFFFF"/>
    ${Array.from({ length: 4 })
      .map((_, i) => {
        const ang = (i / 4) * Math.PI * 2 + rnd() * 0.4;
        const x = cx + Math.cos(ang) * 110;
        const y = cy + Math.sin(ang) * 60;
        return `<g transform="translate(${x} ${y}) rotate(${(rnd() * 60 - 30).toFixed(0)})"><path d="M -70 0 q 30 -55 70 -25 q 60 30 0 60 q -50 25 -70 -35 Z" fill="#C99757" stroke="#8B5A1F" stroke-width="3"/></g>`;
      })
      .join("")}
  `;
}

// ─────────── primitive: pasta bowl ───────────

function drawPasta(): string {
  const cx = W / 2;
  const cy = H / 2 + 50;
  return `
    <ellipse cx="${cx}" cy="${cy + 30}" rx="320" ry="50" fill="#1f1f1f" opacity="0.3"/>
    <ellipse cx="${cx}" cy="${cy}" rx="300" ry="180" fill="#FFFFFF"/>
    <ellipse cx="${cx}" cy="${cy - 6}" rx="270" ry="160" fill="#F0C45E"/>
    <ellipse cx="${cx}" cy="${cy - 20}" rx="220" ry="120" fill="#C0392B"/>
    ${Array.from({ length: 18 })
      .map((_, i) => {
        const ang = (i / 18) * Math.PI * 2;
        const x = cx + Math.cos(ang) * (40 + (i % 4) * 30);
        const y = cy + Math.sin(ang) * (24 + (i % 3) * 18);
        return `<ellipse cx="${x}" cy="${y}" rx="14" ry="6" fill="#F0C45E" transform="rotate(${(ang * 180) / Math.PI} ${x} ${y})"/>`;
      })
      .join("")}
  `;
}

// ─────────── primitive: flatbread ───────────

function drawManqusha(name: string): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  const rnd = mulberry32(hashString(name));
  const topping = /zaatar|thyme/i.test(name)
    ? "#3E5523"
    : /mohamara/i.test(name)
      ? "#8B2E14"
      : /lahma/i.test(name)
        ? "#5A2E14"
        : "#E8B864";
  return `
    <ellipse cx="${cx}" cy="${cy + 30}" rx="360" ry="40" fill="#1f1f1f" opacity="0.3"/>
    <ellipse cx="${cx}" cy="${cy}" rx="350" ry="220" fill="#E0A965"/>
    <ellipse cx="${cx}" cy="${cy - 6}" rx="320" ry="200" fill="${topping}"/>
    ${Array.from({ length: 24 })
      .map(() => {
        const ang = rnd() * Math.PI * 2;
        const rad = rnd() * 280;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * (rad * 0.6);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2 + rnd() * 3).toFixed(1)}" fill="#1f1f1f" opacity="0.5"/>`;
      })
      .join("")}
  `;
}

// ─────────── primitive: salad / sides / desserts / drinks / generic ───────────

function drawSalad(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="340" ry="210" fill="#FFFFFF"/>
    ${Array.from({ length: 36 })
      .map((_, i) => {
        const ang = (i / 36) * Math.PI * 2;
        const r = 60 + (i % 5) * 36;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * (r * 0.62);
        const cols = ["#3E8E55", "#5DAA6A", "#C0392B", "#F2C744", "#8E4FB4"];
        const c = cols[i % cols.length];
        return `<ellipse cx="${x}" cy="${y}" rx="22" ry="12" fill="${c}" transform="rotate(${i * 17} ${x} ${y})"/>`;
      })
      .join("")}
  `;
}

function drawSide(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <path d="M ${cx - 200} ${cy + 200} L ${cx - 140} ${cy - 220} L ${cx + 140} ${cy - 220} L ${cx + 200} ${cy + 200} Z" fill="#C0392B"/>
    ${Array.from({ length: 22 })
      .map((_, i) => {
        const x = cx - 140 + (i % 8) * 36;
        const y = cy - 200 + Math.floor(i / 8) * 60;
        return `<rect x="${x}" y="${y}" width="24" height="${160 - (i % 4) * 16}" rx="4" fill="#F0C45E" stroke="#B5860F" stroke-width="2"/>`;
      })
      .join("")}
  `;
}

function drawDessert(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <rect x="${cx - 280}" y="${cy - 160}" width="560" height="280" rx="20" fill="#5A2E14"/>
    <rect x="${cx - 260}" y="${cy - 140}" width="520" height="60" fill="#F2EAD8"/>
    <rect x="${cx - 260}" y="${cy - 80}" width="520" height="60" fill="#7A3A1D"/>
    <rect x="${cx - 260}" y="${cy - 20}" width="520" height="60" fill="#F2EAD8"/>
    <rect x="${cx - 260}" y="${cy + 40}" width="520" height="60" fill="#7A3A1D"/>
    <circle cx="${cx}" cy="${cy - 180}" r="22" fill="#FFFFFF"/>
  `;
}

function drawDrink(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <path d="M ${cx - 140} ${cy - 220} L ${cx + 140} ${cy - 220} L ${cx + 110} ${cy + 220} L ${cx - 110} ${cy + 220} Z" fill="#FFFFFF" opacity="0.9"/>
    <path d="M ${cx - 130} ${cy - 200} L ${cx + 130} ${cy - 200} L ${cx + 105} ${cy + 100} L ${cx - 105} ${cy + 100} Z" fill="#0E4F73"/>
    <rect x="${cx - 6}" y="${cy - 260}" width="12" height="80" fill="#C0392B"/>
    ${Array.from({ length: 12 })
      .map((_, i) => {
        const x = cx - 60 + (i % 4) * 40;
        const y = cy - 120 + Math.floor(i / 4) * 60;
        return `<circle cx="${x}" cy="${y}" r="10" fill="#FFFFFF" opacity="0.7"/>`;
      })
      .join("")}
  `;
}

function drawGenericDish(name: string): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return `
    <ellipse cx="${cx}" cy="${cy + 20}" rx="340" ry="40" fill="#1f1f1f" opacity="0.3"/>
    <circle cx="${cx}" cy="${cy}" r="240" fill="#FFFFFF"/>
    <circle cx="${cx}" cy="${cy}" r="220" fill="#F2EAD8"/>
    <text x="${cx}" y="${cy + 30}" text-anchor="middle"
      font-family="Georgia, serif" font-size="160" font-weight="700"
      fill="#7A1D12">${esc(initials)}</text>
  `;
}

// ─────────── primitive: deal box ───────────

function drawDeal(): string {
  const cx = W / 2;
  const cy = H / 2 + 40;
  return `
    <rect x="${cx - 320}" y="${cy - 200}" width="640" height="400" rx="16" fill="#C0392B"/>
    <rect x="${cx - 320}" y="${cy - 200}" width="640" height="60" fill="#7A1D12"/>
    <rect x="${cx - 280}" y="${cy - 120}" width="280" height="280" rx="8" fill="#F2EAD8"/>
    <rect x="${cx + 20}" y="${cy - 120}" width="260" height="130" rx="8" fill="#F2EAD8"/>
    <rect x="${cx + 20}" y="${cy + 30}" width="260" height="130" rx="8" fill="#F2EAD8"/>
    <text x="${cx}" y="${cy - 230}" text-anchor="middle"
      font-family="Georgia, serif" font-size="40" font-weight="700"
      fill="#FFFFFF">DEAL</text>
  `;
}

function drawByKind(name: string, meta: DishMeta): string {
  switch (meta.kind) {
    case "pizza-margherita":
    case "pizza-pepperoni":
    case "pizza-veggie":
    case "pizza-hawaiian":
    case "pizza-bbq":
    case "pizza-cheese":
    case "pizza-seafood":
    case "pizza-meat":
    case "pizza-generic":
      return drawPizza(name, pizzaSpecFor(meta.kind));
    case "burger":
      return drawBurger(name);
    case "wrap":
      return drawWrap();
    case "hoagie":
      return drawHoagie();
    case "kebab":
      return drawKebab(name);
    case "chicken":
      return drawChicken(name);
    case "pasta":
      return drawPasta();
    case "manqusha":
      return drawManqusha(name);
    case "salad":
      return drawSalad();
    case "side":
      return drawSide();
    case "dessert":
      return drawDessert();
    case "drink":
      return drawDrink();
    case "deal":
      return drawDeal();
    case "dish":
    default:
      return drawGenericDish(name);
  }
}

export function renderDishSvg({ name, meta }: RenderOpts): string {
  const [from, to] = meta.palette;
  const dish = drawByKind(name, meta);

  const safeName = esc(name);
  const safeCat = esc(meta.category);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${safeName}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="#000" opacity="0.18"/>

  <!-- subtle dish shadow on board -->
  <ellipse cx="${W / 2}" cy="${H / 2 + 320}" rx="380" ry="40" fill="#000" opacity="0.35"/>

  ${dish}

  <rect width="100%" height="100%" fill="url(#vignette)"/>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.5"/>

  <!-- typography -->
  <text x="60" y="92"
    font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700"
    letter-spacing="4" fill="#FFFFFF" opacity="0.85">${safeCat.toUpperCase()}</text>
  <text x="60" y="170"
    font-family="Georgia, 'Playfair Display', serif" font-size="68" font-weight="700"
    fill="#FFFFFF">${safeName}</text>

  <!-- bottom-left wordmark + halal pill -->
  <g transform="translate(60 ${H - 70})">
    <text font-family="Georgia, serif" font-size="26" font-weight="700" fill="#FFFFFF">Margherita Pizzeria</text>
    <text y="28" font-family="Inter, system-ui, sans-serif" font-size="16"
      fill="#FFFFFF" opacity="0.75">Dennistoun · Glasgow</text>
  </g>
  <g transform="translate(${W - 220} ${H - 100})">
    <rect width="160" height="46" rx="23" fill="#FFFFFF" opacity="0.95"/>
    <text x="80" y="30" text-anchor="middle"
      font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="800"
      fill="#0D0D0D">✔ HALAL</text>
  </g>
</svg>`;
}
