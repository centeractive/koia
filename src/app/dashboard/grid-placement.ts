export interface GridSpan {
  columns: number;
  rows: number;
}

export interface GridCell {
  column: number;
  row: number;
}

/**
 * @returns the top left cells of tiles placed through CSS sparse auto-placement in the given order
 */
export function placedCells(gridColumns: number, spans: GridSpan[]): GridCell[] {
  const cells: boolean[][] = [];
  let row = 0;
  let column = 0;
  return spans.map(span => {
    const width = Math.min(span.columns, gridColumns);
    while (!fits(cells, gridColumns, row, column, width, span.rows)) {
      column++;
      if (column + width > gridColumns) {
        column = 0;
        row++;
      }
    }
    mark(cells, gridColumns, { column, row }, { columns: width, rows: span.rows });
    const placed = { column, row };
    column += width;
    return placed;
  });
}

/**
 * marks the grid cells occupied by tiles placed through CSS sparse auto-placement in the given order
 */
export function occupiedCells(gridColumns: number, spans: GridSpan[]): boolean[][] {
  const cells: boolean[][] = [];
  placedCells(gridColumns, spans).forEach((cell, i) =>
    mark(cells, gridColumns, cell, { columns: Math.min(spans[i].columns, gridColumns), rows: spans[i].rows }));
  return cells;
}

function mark(cells: boolean[][], gridColumns: number, cell: GridCell, span: GridSpan): void {
  while (cells.length < cell.row + span.rows) {
    cells.push(new Array<boolean>(gridColumns).fill(false));
  }
  for (let r = cell.row; r < cell.row + span.rows; r++) {
    cells[r].fill(true, cell.column, cell.column + span.columns);
  }
}

function fits(cells: boolean[][], gridColumns: number, row: number, column: number, width: number, height: number): boolean {
  if (column + width > gridColumns) {
    return false;
  }
  for (let r = row; r < row + height; r++) {
    for (let c = column; c < column + width; c++) {
      if (cells[r]?.[c]) {
        return false;
      }
    }
  }
  return true;
}
