import { restaurantLocation } from "@/lib/config/site";
import type { EnhancedConversionUserData } from "@/lib/analytics/gtag";

interface BuildEnhancedConversionDataInput {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  address?: string | null;
}

const UK_POSTCODE_RE =
  /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;

function clean(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normaliseEmail(email?: string | null): string | undefined {
  return clean(email)?.toLowerCase();
}

function normaliseUkPhone(phone?: string | null): string | undefined {
  const raw = clean(phone);
  if (!raw) return undefined;

  const startsWithPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;

  if (startsWithPlus) {
    digits = `+${digits}`;
  } else if (digits.startsWith("00")) {
    digits = `+${digits.slice(2)}`;
  } else if (digits.startsWith("0")) {
    digits = `+44${digits.slice(1)}`;
  } else if (digits.startsWith("44")) {
    digits = `+${digits}`;
  } else {
    digits = `+${digits}`;
  }

  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : undefined;
}

function splitName(name?: string | null): {
  firstName?: string;
  lastName?: string;
} {
  const parts = clean(name)?.split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function extractUkPostcode(address?: string | null): string | undefined {
  const match = clean(address)?.match(UK_POSTCODE_RE);
  if (!match?.[1]) return undefined;

  const compact = match[1].replace(/\s+/g, "").toUpperCase();
  return compact.length > 3
    ? `${compact.slice(0, -3)} ${compact.slice(-3)}`
    : compact;
}

export function buildEnhancedConversionUserData({
  customerName,
  customerEmail,
  customerPhone,
  address,
}: BuildEnhancedConversionDataInput): EnhancedConversionUserData | undefined {
  const email = normaliseEmail(customerEmail);
  const phoneNumber = normaliseUkPhone(customerPhone);
  const { firstName, lastName } = splitName(customerName);
  const street = clean(address);
  const postalCode = extractUkPostcode(address);

  const userData: EnhancedConversionUserData = {};

  if (email) userData.email = email;
  if (phoneNumber) userData.phone_number = phoneNumber;

  const addressData: NonNullable<EnhancedConversionUserData["address"]> = {};
  if (firstName) addressData.first_name = firstName;
  if (lastName) addressData.last_name = lastName;
  if (street) addressData.street = street;
  addressData.city = restaurantLocation.city;
  addressData.region = "Scotland";
  if (postalCode) addressData.postal_code = postalCode;
  addressData.country = restaurantLocation.country;

  userData.address = addressData;

  if (
    !userData.email &&
    !userData.phone_number &&
    !addressData.first_name &&
    !addressData.last_name &&
    !addressData.street
  ) {
    return undefined;
  }

  return userData;
}
