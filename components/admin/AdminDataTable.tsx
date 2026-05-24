"use client";

import { Box, Table } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface AdminColumn<T> {
  header: string;
  key: string;
  render: (row: T) => ReactNode;
  width?: string;
}

export interface AdminDataTableProps<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
}

export function AdminDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records.",
}: AdminDataTableProps<T>) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      overflowX="auto"
      bg="bg.subtle"
    >
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            {columns.map((col) => (
              <Table.ColumnHeader
                key={col.key}
                width={col.width}
                color="fg.muted"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                {col.header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length}>
                <Box color="fg.muted" fontSize="sm" paddingBlock={4} textAlign="center">
                  {emptyMessage}
                </Box>
              </Table.Cell>
            </Table.Row>
          ) : (
            rows.map((row) => (
              <Table.Row key={getRowKey(row)}>
                {columns.map((col) => (
                  <Table.Cell key={col.key} verticalAlign="top">
                    {col.render(row)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
