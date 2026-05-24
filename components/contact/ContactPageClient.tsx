"use client";

import { SimpleGrid, Stack } from "@chakra-ui/react";
import { useCallback, useState } from "react";

import { ContactDetailsCard } from "@/components/contact/ContactDetailsCard";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactSuccessState } from "@/components/contact/ContactSuccessState";

export function ContactPageClient() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmitted = useCallback((message: string) => {
    setSuccessMessage(message);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleReset = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return (
    <SimpleGrid columns={{ base: 1, lg: 5 }} gap={{ base: 6, lg: 10 }}>
      <Stack gap={6} gridColumn={{ lg: "span 3" }}>
        {successMessage ? (
          <ContactSuccessState message={successMessage} onReset={handleReset} />
        ) : (
          <ContactForm onSubmitted={handleSubmitted} />
        )}
      </Stack>
      <Stack gap={6} gridColumn={{ lg: "span 2" }}>
        <ContactDetailsCard />
      </Stack>
    </SimpleGrid>
  );
}
