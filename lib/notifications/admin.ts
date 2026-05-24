import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { adminDevices } from "@/lib/db/schema";
import { sendFcmDataAlert } from "@/lib/fcm/send";

/**
 * Broadcast a high-priority alert to every registered admin device.
 * Best-effort: invalid tokens are pruned automatically. Errors do NOT throw.
 */
export interface AdminAlert {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function notifyAdminDevices(alert: AdminAlert): Promise<{
  attempted: number;
  delivered: number;
  pruned: number;
}> {
  const devices = await db
    .select({ id: adminDevices.id, token: adminDevices.fcmToken })
    .from(adminDevices);
  let delivered = 0;
  let pruned = 0;
  await Promise.all(
    devices.map(async (d) => {
      const res = await sendFcmDataAlert({
        token: d.token,
        title: alert.title,
        body: alert.body,
        data: alert.data,
        androidPriority: "high",
        androidChannelId: "admin_alerts",
      });
      if (res.ok) {
        delivered += 1;
        return;
      }
      if ("tokenInvalid" in res && res.tokenInvalid) {
        await db.delete(adminDevices).where(eq(adminDevices.id, d.id));
        pruned += 1;
      }
    }),
  );
  return { attempted: devices.length, delivered, pruned };
}
