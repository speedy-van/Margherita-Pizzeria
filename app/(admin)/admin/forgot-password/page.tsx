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
        padding: "24px",
      }}
    >
      <AdminForgotPasswordForm />
    </main>
  );
}
