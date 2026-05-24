import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { ClientChrome } from "@/components/layout/ClientChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export interface AppShellProps {
  children: ReactNode;
  hideChrome?: boolean;
}

export function AppShell({ children, hideChrome = false }: AppShellProps) {
  return (
    <Box display="flex" flexDirection="column" minH="100dvh" bg="bg">
      {!hideChrome ? <SiteHeader /> : null}
      <Box as="div" flex="1" paddingBottom={!hideChrome ? { base: "72px", md: 0 } : 0}>
        {children}
      </Box>
      {!hideChrome ? <SiteFooter /> : null}
      {!hideChrome ? <ClientChrome /> : null}
    </Box>
  );
}
