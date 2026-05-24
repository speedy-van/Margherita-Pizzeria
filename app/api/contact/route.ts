import { NextResponse } from "next/server";

import { sendContactMessageEmail } from "@/lib/resend/send-contact-message";
import { validateContactMessageInput } from "@/lib/validations/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "cache-control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const validation = validateContactMessageInput(body);
  if (!validation.ok) {
    // Honeypot: pretend the request was fine so spam bots get no signal,
    // but never actually send anything.
    if (validation.error.code === "HONEYPOT_TRIGGERED") {
      return NextResponse.json(
        {
          ok: true,
          data: { message: "Thanks — your message has been received." },
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );
    }
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status, headers: NO_STORE_HEADERS },
    );
  }

  const result = await sendContactMessageEmail(validation.data);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CONTACT_SEND_FAILED",
          message:
            "We could not send your message right now. Please try again shortly.",
        },
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: { message: "Thanks — your message has been received." },
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
