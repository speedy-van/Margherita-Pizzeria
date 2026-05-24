"use client";

import {
  Box,
  Checkbox,
  Field,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

import type { OpeningHours, OpeningHoursDay } from "@/types/database";

const DAYS: (keyof OpeningHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  disabled?: boolean;
}

export function OpeningHoursEditor({
  value,
  onChange,
  disabled,
}: OpeningHoursEditorProps) {
  const update = (day: keyof OpeningHours, patch: Partial<OpeningHoursDay>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  return (
    <Stack gap={3}>
      {DAYS.map((day) => {
        const entry = value[day];
        const closed = entry.closed === true;
        return (
          <Box
            key={day}
            borderWidth="1px"
            borderColor="border"
            borderRadius="md"
            bg="bg.subtle"
            padding={3}
          >
            <HStack gap={3} flexWrap="wrap" align="flex-end">
              <Text
                width="100px"
                textTransform="capitalize"
                fontWeight="600"
                fontSize="sm"
              >
                {day}
              </Text>
              <Checkbox.Root
                checked={closed}
                onCheckedChange={(d) =>
                  update(day, { closed: d.checked === true })
                }
                disabled={disabled}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Closed</Checkbox.Label>
              </Checkbox.Root>
              <Field.Root maxW="120px" disabled={closed || disabled}>
                <Field.Label>Open</Field.Label>
                <Input
                  size="sm"
                  type="time"
                  value={entry.open}
                  onChange={(e) => update(day, { open: e.target.value })}
                  disabled={closed || disabled}
                />
              </Field.Root>
              <Field.Root maxW="120px" disabled={closed || disabled}>
                <Field.Label>Close</Field.Label>
                <Input
                  size="sm"
                  type="time"
                  value={entry.close}
                  onChange={(e) => update(day, { close: e.target.value })}
                  disabled={closed || disabled}
                />
              </Field.Root>
            </HStack>
          </Box>
        );
      })}
    </Stack>
  );
}
