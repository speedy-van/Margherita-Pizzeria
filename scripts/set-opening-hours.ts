import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { OPENING_HOURS_SETTING_KEY } from "@/lib/utils/shop-hours";
import type { OpeningHours } from "@/types/database";

const HOURS: OpeningHours = {
  monday: { open: "11:00", close: "23:00" },
  tuesday: { open: "11:00", close: "23:00" },
  wednesday: { open: "11:00", close: "23:00" },
  thursday: { open: "11:00", close: "23:00" },
  friday: { open: "11:00", close: "00:00" },
  saturday: { open: "11:00", close: "00:00" },
  sunday: { open: "11:00", close: "23:00" },
};

async function main() {
  const before = await db
    .select()
    .from(settings)
    .where(eq(settings.key, OPENING_HOURS_SETTING_KEY));
  console.log("Before:", JSON.stringify(before[0]?.value ?? null, null, 2));

  const existing = before[0];
  if (existing) {
    await db
      .update(settings)
      .set({ value: HOURS })
      .where(eq(settings.key, OPENING_HOURS_SETTING_KEY));
  } else {
    await db.insert(settings).values({
      key: OPENING_HOURS_SETTING_KEY,
      value: HOURS,
    });
  }

  const after = await db
    .select()
    .from(settings)
    .where(eq(settings.key, OPENING_HOURS_SETTING_KEY));
  console.log("After:", JSON.stringify(after[0]?.value ?? null, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
