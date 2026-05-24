import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is required to run drizzle-kit commands. Set it in .env.local.",
  );
}

// drizzle-kit 0.18 typings don't yet expose `dialect`, but the CLI accepts it.
const config = {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
  verbose: true,
} as unknown as Config;

export default config;
