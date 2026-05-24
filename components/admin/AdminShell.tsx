"use client";

import {
  Box,
  Button,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { useState } from "react";

import { siteConfig } from "@/lib/config/site";
import type { UserRole } from "@/types/database";

interface AdminNavItem {
  href: string;
  label: string;
}

const NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/images", label: "Images" },
];

export interface AdminShellProps {
  user: { email: string; role: UserRole };
  children: ReactNode;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <Stack as="nav" aria-label="Admin" gap={1}>
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <NextLink key={item.href} href={item.href} onClick={onNavigate}>
            <Box
              paddingBlock={2.5}
              paddingInline={3}
              borderRadius="md"
              bg={active ? "brand.solid" : "transparent"}
              color={active ? "brand.contrast" : "fg.default"}
              fontWeight={active ? "700" : "500"}
              fontSize="sm"
              _hover={{ bg: active ? "brand.emphasized" : "bg.subtle" }}
            >
              {item.label}
            </Box>
          </NextLink>
        );
      })}
    </Stack>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onSignOut = async () => {
    await signOut({ redirect: false });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <Box minH="100dvh" bg="bg" display="flex" flexDirection="column">
      <Box
        as="header"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
        position="sticky"
        top={0}
        zIndex={20}
      >
        <Flex
          align="center"
          justify="space-between"
          paddingInline={{ base: 4, md: 6 }}
          paddingBlock={3}
          gap={3}
        >
          <HStack gap={3}>
            <IconButton
              aria-label="Open admin menu"
              variant="ghost"
              size="sm"
              display={{ base: "inline-flex", md: "none" }}
              onClick={() => setOpen(true)}
            >
              <Box as="span" aria-hidden fontSize="lg">
                ☰
              </Box>
            </IconButton>
            <Stack gap={0} lineHeight="1">
              <Text fontFamily="heading" fontSize="md" fontWeight="700">
                {siteConfig.name}
              </Text>
              <Text
                fontSize="xs"
                color="brand.fg"
                letterSpacing="0.18em"
                textTransform="uppercase"
                fontWeight="600"
              >
                Admin
              </Text>
            </Stack>
          </HStack>
          <HStack gap={3}>
            <Stack gap={0} lineHeight="1" display={{ base: "none", sm: "flex" }}>
              <Text fontSize="sm" fontWeight="600" color="fg.default">
                {user.email}
              </Text>
              <Text fontSize="xs" color="fg.muted" textTransform="capitalize">
                {user.role}
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              onClick={onSignOut}
            >
              Sign out
            </Button>
          </HStack>
        </Flex>
      </Box>
      <Flex flex="1" align="stretch">
        <Box
          as="aside"
          display={{ base: "none", md: "block" }}
          width="240px"
          borderRightWidth="1px"
          borderColor="border"
          padding={4}
          bg="bg"
        >
          <NavLinks />
        </Box>
        <Box as="main" flex="1" padding={{ base: 4, md: 6 }} maxW="100%" minW="0">
          {children}
        </Box>
      </Flex>
      <Drawer.Root
        open={open}
        onOpenChange={(d) => setOpen(d.open)}
        placement="start"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="280px">
            <Drawer.Header borderBottomWidth="1px" borderColor="border">
              <Text fontWeight="700">Admin</Text>
            </Drawer.Header>
            <Drawer.Body>
              <NavLinks onNavigate={() => setOpen(false)} />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}
