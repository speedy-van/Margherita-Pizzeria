import type { Metadata } from "next";

import { BookingPageClient } from "@/components/booking/BookingPageClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { getBookingSettings } from "@/lib/bookings/availability";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Book a Table Glasgow | Margherita Pizzeria",
  description:
    "Book one of six tables at Margherita Pizzeria on Alexandra Parade, Glasgow.",
  path: "/book",
  keywords: getKeywordsForPath("/book"),
});

const MAX_FUTURE_DAYS = 90;

function todayYmd(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysYmd(base: string, days: number): string {
  const [yStr, mStr, dStr] = base.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default async function BookPage() {
  const initialDate = todayYmd();
  const minDate = initialDate;
  const maxDate = addDaysYmd(initialDate, MAX_FUTURE_DAYS);

  try {
    const settings = await getBookingSettings();
    return (
      <>
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: "Book a table", path: "/book" },
          ]}
        />
        <BookingPageClient
          initialSettings={settings}
          initialDate={initialDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      </>
    );
  } catch {
    return (
      <PageShell
        eyebrow="Book a table"
        title="Booking unavailable"
        description="We couldn't load the booking system right now."
      >
        <ErrorState
          title="Something went wrong"
          description="Please try again in a moment, or contact us to book by phone."
        />
      </PageShell>
    );
  }
}
