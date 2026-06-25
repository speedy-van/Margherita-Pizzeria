import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { ClientChrome } from "./ClientChrome";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import type { OpeningHours } from "@/types/database";

export interface AppShellProps {
  children: ReactNode;
  hideChrome?: boolean;
  openingHours?: OpeningHours;
}

export function AppShell({
  children,
  hideChrome = false,
  openingHours,
}: AppShellProps) {
  return (
    <Box display="flex" flexDirection="column" minH="100dvh" bg="bg">
      {!hideChrome ? <SiteHeader /> : null}
      <Box as="div" flex="1" paddingBottom={!hideChrome ? { base: "72px", md: 0 } : 0}>
        {children}
      </Box>
      {!hideChrome ? <SiteFooter openingHours={openingHours} /> : null}
      {!hideChrome ? <ClientChrome /> : null}
    </Box>
  );
}
