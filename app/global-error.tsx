"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          backgroundColor: "#0D0D0D",
          color: "#F5F5F0",
          fontFamily:
            "var(--font-body), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "520px", width: "100%" }}>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: "12px",
              color: "#E69A8C",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Something burned in the oven
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "32px",
              lineHeight: 1.1,
              margin: "12px 0 16px",
            }}
          >
            We hit an unexpected error.
          </h1>
          <p style={{ color: "#A0998C", margin: "0 0 24px", lineHeight: 1.5 }}>
            Please try again. If this keeps happening, refresh the page or come
            back in a few minutes.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: "#C0392B",
              color: "#F5F5F0",
              border: 0,
              borderRadius: "8px",
              padding: "12px 20px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
