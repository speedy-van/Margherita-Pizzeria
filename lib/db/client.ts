import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  // env.ts already warns/throws based on environment; this guard keeps the
  // exported `db` strongly typed without forcing an at-import-time crash in
  // unit tests that mock the module.
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local before importing lib/db/client.",
  );
}

export const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export { schema };
