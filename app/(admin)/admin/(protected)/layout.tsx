import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentAdminSession();
  if (!user) redirect("/admin/login");
  return (
    <AdminShell user={{ email: user.email, role: user.role }}>
      {children}
    </AdminShell>
  );
}
