import type { Metadata } from "next";

import { AdminResetPasswordForm } from "@/components/admin/AdminResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

interface ResetPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminResetPasswordPage({
  searchParams,
}: ResetPageProps) {
  const { token } = await searchParams;
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
      <AdminResetPasswordForm token={typeof token === "string" ? token : ""} />
    </main>
  );
}
