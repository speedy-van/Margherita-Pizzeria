"use client";

import dynamic from "next/dynamic";

// Client-only widgets (FAB + mobile bottom bar). Loaded after hydration so
// they don't perturb the SSR Emotion style insertion order.
const WhatsAppFab = dynamic(
  () => import("@/components/layout/WhatsAppFab").then((m) => m.WhatsAppFab),
  { ssr: false },
);
const MobileQuickBar = dynamic(
  () =>
    import("@/components/layout/MobileQuickBar").then((m) => m.MobileQuickBar),
  { ssr: false },
);
const InstallAppPrompt = dynamic(
  () =>
    import("@/components/layout/InstallAppPrompt").then((m) => m.InstallAppPrompt),
  { ssr: false },
);
const ServiceWorkerRegister = dynamic(
  () =>
    import("@/components/layout/ServiceWorkerRegister").then(
      (m) => m.ServiceWorkerRegister,
    ),
  { ssr: false },
);

export function ClientChrome() {
  return (
    <>
      <WhatsAppFab />
      <MobileQuickBar />
      <InstallAppPrompt />
      <ServiceWorkerRegister />
    </>
  );
}
