import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { ImagesAdminClient } from "@/components/admin/ImagesAdminClient";
import { getAdminImages } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Images",
  robots: { index: false, follow: false },
};

export default async function AdminImagesPage() {
  try {
    const imgs = await getAdminImages();
    return <ImagesAdminClient images={imgs} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/images] failed:", err);
    return <AdminErrorState title="Could not load images" />;
  }
}
