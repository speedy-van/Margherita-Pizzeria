"use client";

import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";

import type { InvoiceDocumentModel, InvoiceStatusModel } from "@/lib/invoices/model";
import { buildInvoiceTemplate } from "@/lib/invoices/template";

export interface InvoiceAdminClientProps {
  invoice: InvoiceDocumentModel;
}

function StatusPill({ status }: { status: InvoiceStatusModel }) {
  const colors: Record<InvoiceStatusModel["tone"], { bg: string; color: string }> = {
    paid: { bg: "green.100", color: "green.800" },
    delivered: { bg: "green.100", color: "green.800" },
    unpaid: { bg: "orange.100", color: "orange.800" },
    cancelled: { bg: "red.100", color: "red.800" },
    in_progress: { bg: "blue.100", color: "blue.800" },
  };
  const c = colors[status.tone];
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      minH="28px"
      paddingInline={3}
      borderRadius="full"
      bg={c.bg}
      color={c.color}
      fontSize="xs"
      fontWeight="800"
      textTransform="uppercase"
    >
      {status.label}
    </Box>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
      padding={5}
    >
      <Stack gap={3}>
        <Heading as="h2" size="sm" color="fg.default">
          {title}
        </Heading>
        {children}
      </Stack>
    </Box>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" gap={4} fontSize="sm">
      <Text color="fg.muted">{label}</Text>
      <Text color="fg.default" fontWeight="600" textAlign="right">
        {value}
      </Text>
    </Box>
  );
}

export function InvoiceAdminClient({ invoice }: InvoiceAdminClientProps) {
  const pdfHref = `/api/admin/invoices/${invoice.id}/pdf`;
  const template = buildInvoiceTemplate(invoice);

  return (
    <Stack gap={6}>
      <Stack gap={4}>
        <HStack justify="space-between" align="flex-start" gap={4} flexWrap="wrap">
          <Stack gap={2}>
            <HStack gap={3} align="center">
              {invoice.business.logoUrl ? (
                <Image
                  src={invoice.business.logoUrl}
                  alt={`${invoice.business.name} logo`}
                  boxSize="48px"
                  borderRadius="md"
                  objectFit="contain"
                  bg="bg.subtle"
                />
              ) : null}
              <Stack gap={0}>
                <Text
                  color="brand.fg"
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.14em"
                >
                  {invoice.business.name}
                </Text>
                <Text color="fg.muted" fontSize="xs">
                  {template.businessContactLines.join(" · ")}
                </Text>
              </Stack>
            </HStack>
            <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
              {template.title}
            </Heading>
            <HStack gap={2} flexWrap="wrap">
              {template.statusBadges.map((status) => (
                <StatusPill key={`${status.tone}-${status.label}`} status={status} />
              ))}
            </HStack>
          </Stack>
          <HStack gap={2} flexWrap="wrap">
            <Button type="button" variant="outline" onClick={() => window.print()}>
              Print
            </Button>
            <a
              href={pdfHref}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 40,
                paddingInline: 16,
                borderRadius: 6,
                background: "#C0392B",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Download PDF
            </a>
          </HStack>
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          Order {invoice.orderReference} · Issued {invoice.issueDate}
        </Text>
      </Stack>

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={4}>
        <Card title="Bill to">
          <Stack gap={1} fontSize="sm">
            {template.customerLines.map((line, index) => (
              <Text
                key={`${line}-${index}`}
                color={index === 0 ? "fg.default" : "fg.muted"}
                fontWeight={index === 0 ? "700" : "400"}
              >
                {line}
              </Text>
            ))}
          </Stack>
        </Card>

        <Card title="Invoice details">
          <Stack gap={2}>
            {template.details.map((line) => (
              <Line key={line.label} label={line.label} value={line.value} />
            ))}
          </Stack>
        </Card>

        <Card title="Items">
          <Stack gap={0}>
            {template.items.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                No invoice items
              </Text>
            ) : (
              template.items.map((item, index) => (
                <Box
                  key={item.id}
                  display="grid"
                  gridTemplateColumns={{ base: "1fr auto", md: "1fr 64px 90px 90px" }}
                  gap={3}
                  borderTopWidth={index === 0 ? "0" : "1px"}
                  borderColor="border"
                  paddingBlock={3}
                  alignItems="start"
                >
                  <Text fontWeight="700">{item.name}</Text>
                  <Text textAlign={{ base: "right", md: "center" }}>{item.quantity}</Text>
                  <Text display={{ base: "none", md: "block" }} textAlign="right">
                    {item.unitPrice}
                  </Text>
                  <Text fontWeight="800" textAlign="right">
                    {item.rowTotal}
                  </Text>
                </Box>
              ))
            )}
          </Stack>
        </Card>

        <Card title="Totals">
          <Stack gap={2}>
            {template.totals.map((line) =>
              line.emphasis ? (
                <Box
                  key={line.id}
                  borderTopWidth="1px"
                  borderColor="border"
                  paddingTop={3}
                >
                  <Line label={line.label} value={line.value} />
                </Box>
              ) : (
                <Line key={line.id} label={line.label} value={line.value} />
              ),
            )}
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}
