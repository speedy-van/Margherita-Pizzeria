import type { BookingStatus } from "@/lib/bookings/types";

const TERMINAL: ReadonlySet<BookingStatus> = new Set<BookingStatus>([
  "rejected",
  "cancelled",
  "completed",
]);

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return TERMINAL.has(status);
}

const LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  rejected: "Not accepted",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function bookingStatusLabel(status: BookingStatus): string {
  return LABELS[status];
}

export function bookingCustomerMessage(
  status: BookingStatus,
  depositPaid: boolean,
): string {
  const depositNote = depositPaid
    ? " Your deposit has been recorded."
    : "";
  switch (status) {
    case "pending":
      return "We have received your booking request." + depositNote;
    case "confirmed":
      return "Your table is confirmed." + depositNote;
    case "rejected":
      return "This booking could not be accepted." + depositNote;
    case "cancelled":
      return "This booking has been cancelled." + depositNote;
    case "completed":
      return "Thanks for visiting." + depositNote;
  }
}
