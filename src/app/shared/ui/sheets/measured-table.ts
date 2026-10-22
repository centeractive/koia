import { RowSpan } from './page-breaks';

export interface MeasuredTable {
  element: HTMLTableElement;
  height: number;
  /** rows relative to the table top */
  rows: RowSpan[];
  /** width of the grid line between rows */
  gridLine: number;
}

export function measureTable(table: HTMLTableElement): MeasuredTable {
  const tableTop = table.getBoundingClientRect().top;
  const rows = Array.from(table.rows).map(row => {
    const rect = row.getBoundingClientRect();
    return { top: rect.top - tableTop, bottom: rect.bottom - tableTop };
  });
  const cell = table.querySelector('td, th');
  const gridLine = cell ? parseFloat(getComputedStyle(cell).borderTopWidth) || 0 : 0;
  return { element: table, height: table.offsetHeight, rows, gridLine };
}
