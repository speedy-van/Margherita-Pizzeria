/**
 * Runtime environment variable validation.
 *
 * Phase 1 only verifies that variables are present (and non-empty in production).
 * Network calls to Stripe / Resend / Mapbox / FCM are NOT made here — those
 * integrations land in later phases. `.env.example` documents every key.
 */

type EnvShape = {
  NODE_ENV: "development" | "production" | "test";
  NEXT_PUBLIC_SITE_URL: string;
  DATABASE_URL: string;
  NEXT_PUBLIC_MAPBOX_TOKEN: string;
  NEXTAUTH_SECRET: string;
  AUTH_RESEND_KEY: string;
  RESEND_FROM_EMAIL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  /** Optional. Required only once push notifications are wired up. */
  FCM_PROJECT_ID: string;
  /** Optional. Required only once push notifications are wired up. */
  FCM_CLIENT_EMAIL: string;
  /** Optional. Required only once push notifications are wired up. Never logged. */
  FCM_PRIVATE_KEY: string;
  /** Optional. Only used by the seed script to bootstrap an admin user. */
  ADMIN_SEED_EMAIL: string;
  /** Optional. Only used by the seed script. Never logged. */
  ADMIN_SEED_PASSWORD: string;
  /** Optional. Inbox that receives /contact form submissions. Falls back to ADMIN_NOTIFICATION_EMAIL then RESEND_FROM_EMAIL. */
  CONTACT_TO_EMAIL: string;
  /** Optional. Inbox that receives admin-side operational notifications (new orders, new bookings). */
  ADMIN_NOTIFICATION_EMAIL: string;
};

const REQUIRED_IN_PROD = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_MAPBOX_TOKEN",
  "NEXTAUTH_SECRET",
  "AUTH_RESEND_KEY",
  "RESEND_FROM_EMAIL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  // FCM_* are intentionally omitted: push notifications are not part of the
  // production cutover yet. They become required once the FCM helper is wired
  // up (see `hasFcmConfig` below).
] as const satisfies ReadonlyArray<keyof EnvShape>;

const REQUIRED_ALWAYS = ["DATABASE_URL"] as const satisfies ReadonlyArray<
  keyof EnvShape
>;

function readEnv(): EnvShape {
  const nodeEnvRaw = process.env.NODE_ENV;
  const nodeEnv: EnvShape["NODE_ENV"] =
    nodeEnvRaw === "production" || nodeEnvRaw === "test"
      ? nodeEnvRaw
      : "development";

  const isProd = nodeEnv === "production";

  const defaultSiteUrl = isProd ? "" : "https://www.margheritapizza.uk";

  const raw: EnvShape = {
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl,
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
    AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY ?? "",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    FCM_PROJECT_ID: process.env.FCM_PROJECT_ID ?? "",
    FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL ?? "",
    FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY ?? "",
    ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL ?? "",
    ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD ?? "",
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL ?? "",
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL ?? "",
  };

  const missing: string[] = [];
  const checklist: ReadonlyArray<keyof EnvShape> = isProd
    ? REQUIRED_IN_PROD
    : REQUIRED_ALWAYS;

  for (const key of checklist) {
    if (!raw[key] || raw[key].trim() === "") {
      missing.push(key);
    }
  }

  // Server-only secrets aren't (and shouldn't be) available in the browser
  // bundle — skip warnings there to avoid noisy console output on the client.
  const isBrowser = typeof window !== "undefined";

  if (missing.length > 0 && !isBrowser) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    if (isProd) {
      throw new Error(message);
    }
    // In dev, warn loudly but don't crash so initial scaffolding still runs.
    // eslint-disable-next-line no-console
    console.warn(`[env] ${message}`);
  }

  return raw;
}

export const env: EnvShape = readEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

/**
 * True when all three FCM service-account credentials are present.
 * Push-notification helpers must check this before attempting to send and
 * skip safely (no throw, no log of the private key) when it is false.
 */
export const hasFcmConfig: boolean =
  env.FCM_PROJECT_ID.trim() !== "" &&
  env.FCM_CLIENT_EMAIL.trim() !== "" &&
  env.FCM_PRIVATE_KEY.trim() !== "";
