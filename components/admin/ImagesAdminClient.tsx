"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ImageUrlForm } from "@/components/admin/ImageUrlForm";
import type { AdminImage } from "@/lib/admin/types";

export interface ImagesAdminClientProps {
  images: AdminImage[];
}

export function ImagesAdminClient({ images }: ImagesAdminClientProps) {
  const grouped = images.reduce<Record<string, AdminImage[]>>((acc, img) => {
    const k = img.section || "general";
    (acc[k] ||= []).push(img);
    return acc;
  }, {});
  const sections = Object.keys(grouped).sort();

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
          Images
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Update image URLs for branded sections. Use a CDN or hosted image URL.
        </Text>
      </Stack>
      {images.length === 0 ? (
        <AdminEmptyState
          title="No images registered"
          description="Seed image rows in the database to manage them here."
        />
      ) : (
        <Stack gap={6}>
          {sections.map((section) => (
            <Stack key={section} gap={3}>
              <Heading
                as="h2"
                size="md"
                color="fg.default"
                textTransform="capitalize"
              >
                {section}
              </Heading>
              <Stack gap={4}>
                {grouped[section]!.map((img) => (
                  <Box
                    key={img.id}
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="lg"
                    bg="bg.subtle"
                    padding={4}
                  >
                    <Stack gap={2}>
                      <Text fontWeight="600">{img.label}</Text>
                      <ImageUrlForm image={img} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
