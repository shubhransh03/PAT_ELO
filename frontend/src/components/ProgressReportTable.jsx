import React, { useMemo, useState } from 'react';
import { Checkbox, Group, ScrollArea, Table, Text, Badge } from '@mantine/core';

export default function ProgressReportTable({ rows = [], selectedIds, onSelectionChange }) {
  const [internal, setInternal] = useState([]);
  const controlled = Array.isArray(selectedIds);
  const selection = controlled ? selectedIds : internal;
  const allIds = useMemo(() => rows.map(r => String(r.id)), [rows]);

  const isAllSelected = selection.length > 0 && selection.length === allIds.length;
  const isIndeterminate = selection.length > 0 && selection.length < allIds.length;

  const setSel = (next) => {
    if (controlled) onSelectionChange?.(next); else setInternal(next);
  };

  const toggleRow = (id) => {
    const next = selection.includes(id) ? selection.filter(x => x !== id) : [...selection, id];
    setSel(next);
  };

  const toggleAll = () => setSel(isAllSelected ? [] : allIds);

  return (
    <ScrollArea>
      <Table miw={900} verticalSpacing="sm" highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={toggleAll} />
            </Table.Th>
            <Table.Th>Patient</Table.Th>
            <Table.Th>Sessions</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Submitted</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => {
            const id = String(r.id);
            const selected = selection.includes(id);
            return (
              <Table.Tr key={id} data-selected={selected}>
                <Table.Td>
                  <Checkbox checked={selected} onChange={() => toggleRow(id)} aria-label={`Select ${r.patient}`} />
                </Table.Td>
                <Table.Td>
                  <Group gap="sm">
                    <Text size="sm" fw={600}>{r.patient}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{r.sessions}</Table.Td>
                <Table.Td>
                  {r.reviewed ? (
                    <Badge color="teal" variant="light">Reviewed</Badge>
                  ) : (
                    <Badge color="yellow" variant="light">Pending Review</Badge>
                  )}
                </Table.Td>
                <Table.Td>{r.submitted}</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
