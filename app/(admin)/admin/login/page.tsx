import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getCurrentAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const existing = await getCurrentAdminSession();
  if (existing) redirect("/admin");

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
      <AdminLoginForm />
    </main>
  );
}
