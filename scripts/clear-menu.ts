import { db } from "@/lib/db/client";
import { menuCategories, menuItems } from "@/lib/db/schema";

async function main() {
  const itemsBefore = await db.select().from(menuItems);
  const catsBefore = await db.select().from(menuCategories);
  console.log(
    `Before: ${itemsBefore.length} items, ${catsBefore.length} categories`,
  );

  await db.delete(menuItems);
  await db.delete(menuCategories);

  const itemsAfter = await db.select().from(menuItems);
  const catsAfter = await db.select().from(menuCategories);
  console.log(
    `After:  ${itemsAfter.length} items, ${catsAfter.length} categories`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
