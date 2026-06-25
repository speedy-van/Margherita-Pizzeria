import type { Metadata } from "next";

import { AdminForgotPasswordForm } from "@/components/admin/AdminForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function AdminForgotPasswordPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingRight: "24px",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        paddingLeft: "24px",
      }}
    >
      <AdminForgotPasswordForm />
    </main>
  );
}
