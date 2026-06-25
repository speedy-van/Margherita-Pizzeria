import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Box, Heading, Link, List, Stack, Text } from "@chakra-ui/react";

import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { contactDetails, siteConfig } from "@/lib/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy | Margherita Pizzeria",
  description:
    "How Margherita Pizzeria handles order, booking, account and restaurant admin data.",
  path: "/privacy",
});

const lastUpdated = "22 June 2026";

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      description={`Last updated: ${lastUpdated}`}
      maxW="container.lg"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]}
      />

      <Stack gap={6} color="fg.default">
        <PolicySection title="Who we are">
          <Text>
            This policy explains how {siteConfig.name} handles personal data for
            restaurant orders, table bookings, customer enquiries and our internal
            admin tools.
          </Text>
          <Text>
            Contact us at{" "}
            <Link href={`mailto:${contactDetails.email}`}>{contactDetails.email}</Link>{" "}
            or {contactDetails.primaryPhone}.
          </Text>
        </PolicySection>

        <PolicySection title="Data we collect">
          <List.Root ps={5}>
            <List.Item>Customer name, phone number, email address and delivery address.</List.Item>
            <List.Item>Order details, booking details, notes, status and payment status.</List.Item>
            <List.Item>Admin account email, role and login session information.</List.Item>
            <List.Item>Device or browser information needed for security, diagnostics and service reliability.</List.Item>
            <List.Item>Advertising and analytics events used to measure online order performance.</List.Item>
            <List.Item>Notification tokens if an admin device enables order or booking alerts.</List.Item>
          </List.Root>
        </PolicySection>

        <PolicySection title="How we use data">
          <List.Root ps={5}>
            <List.Item>To prepare, deliver, manage and support orders and bookings.</List.Item>
            <List.Item>To let restaurant staff manage live operations in the admin app.</List.Item>
            <List.Item>To contact customers about their order, booking or enquiry.</List.Item>
            <List.Item>To protect the service, investigate errors and prevent duplicate or fraudulent requests.</List.Item>
            <List.Item>To measure online order conversions and improve our advertising.</List.Item>
          </List.Root>
        </PolicySection>

        <PolicySection title="Payments">
          <Text>
            Card payments are handled by our payment provider. We do not store full
            card numbers in our own systems. We may store payment status, payment
            reference, order total, deposit status and refund status where needed
            for restaurant operations and support.
          </Text>
        </PolicySection>

        <PolicySection title="Sharing">
          <Text>
            We do not sell personal data. We share data only with service providers
            needed to run the restaurant service, such as hosting, payment,
            email, maps, analytics, diagnostics and delivery or ordering systems
            where applicable.
          </Text>
          <Text>
            When a customer completes an online order, limited contact details may
            be sent to Google Ads for enhanced conversion measurement. Google uses
            this data to match ad interactions to orders and process it according
            to its advertising data terms.
          </Text>
        </PolicySection>

        <PolicySection title="Retention and deletion">
          <Text>
            We keep order, booking and admin records only as long as needed for
            restaurant operations, legal, tax, accounting, dispute handling and
            security purposes. To request access, correction or deletion of data,
            contact us using the details above.
          </Text>
        </PolicySection>

        <PolicySection title="Internal admin app">
          <Text>
            The Margherita Admin app is for authorised restaurant staff only. It
            does not create public customer accounts. Admin access is provided and
            removed by restaurant management.
          </Text>
        </PolicySection>
      </Stack>
    </PageShell>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box as="section" borderWidth="1px" borderColor="border" borderRadius="lg" p={{ base: 5, md: 6 }}>
      <Stack gap={3}>
        <Heading as="h2" size="md">
          {title}
        </Heading>
        {children}
      </Stack>
    </Box>
  );
}
