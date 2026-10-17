/**
 * marks the grid cells occupied by tiles placed through CSS sparse auto-placement in the given order
 */
export function occupiedCells(gridColumns: number, spans: { columns: number; rows: number }[]): boolean[][] {
  const cells: boolean[][] = [];
  let row = 0;
  let column = 0;
  for (const span of spans) {
    const width = Math.min(span.columns, gridColumns);
    while (!fits(cells, gridColumns, row, column, width, span.rows)) {
      column++;
      if (column + width > gridColumns) {
        column = 0;
        row++;
      }
    }
    while (cells.length < row + span.rows) {
      cells.push(new Array<boolean>(gridColumns).fill(false));
    }
    for (let r = row; r < row + span.rows; r++) {
      cells[r].fill(true, column, column + width);
    }
    column += width;
  }
  return cells;
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
