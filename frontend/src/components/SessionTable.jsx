import React, { useMemo, useState } from 'react';
import { Avatar, Checkbox, Group, ScrollArea, Table, Text } from '@mantine/core';

/**
 * SessionTable
 * Props:
 * - rows: Array<{ id: string, patientName: string, date: string, duration: string, activities: string, outcomes: string, avatarUrl?: string }>
 * - onSelectionChange?: (ids: string[]) => void
 */
export default function SessionTable({ rows = [], onSelectionChange, selectedIds }) {
  // Support controlled selection via selectedIds; fallback to internal state
  const [internalSelection, setInternalSelection] = useState([]);
  const controlled = Array.isArray(selectedIds);
  const selection = controlled ? selectedIds : internalSelection;

  const allIds = useMemo(() => rows.map(r => String(r.id)), [rows]);
  const isAllSelected = selection.length > 0 && selection.length === allIds.length;
  const isIndeterminate = selection.length > 0 && selection.length < allIds.length;

  const toggleRow = (id) => {
    const compute = (curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]);
    if (controlled) {
      const next = compute(selection);
      onSelectionChange?.(next);
    } else {
      setInternalSelection((curr) => {
        const next = compute(curr);
        onSelectionChange?.(next);
        return next;
      });
    }
  };

  const toggleAll = () => {
    const next = selection.length === allIds.length ? [] : allIds;
    if (controlled) {
      onSelectionChange?.(next);
    } else {
      setInternalSelection(next);
      onSelectionChange?.(next);
    }
  };

  return (
    <ScrollArea>
      <Table miw={900} verticalSpacing="sm" highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox onChange={toggleAll} checked={isAllSelected} indeterminate={isIndeterminate} />
            </Table.Th>
            <Table.Th>Patient</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Duration</Table.Th>
            <Table.Th>Activities</Table.Th>
            <Table.Th>Outcomes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((item) => {
            const id = String(item.id);
            const selected = selection.includes(id);
            return (
              <Table.Tr key={id} data-selected={selected}>
                <Table.Td>
                  <Checkbox checked={selected} onChange={() => toggleRow(id)} aria-label={`Select row for ${item.patientName}`} />
                </Table.Td>
                <Table.Td>
                  <Group gap="sm">
                    <Avatar size={26} src={item.avatarUrl} radius={26}>
                      {item.patientName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={600}>{item.patientName}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{item.date}</Table.Td>
                <Table.Td>{item.duration}</Table.Td>
                <Table.Td style={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.activities}
                </Table.Td>
                <Table.Td style={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.outcomes}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
