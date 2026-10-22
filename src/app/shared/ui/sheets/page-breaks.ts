export interface RowSpan {
  top: number;
  bottom: number;
}

/**
 * breaks rows into pages of the given height, a page starts at the top of the row that does not fit on the page above,
 * a row taller than a page is cut
 */
export function pageTopsOf(rows: RowSpan[], pageHeight: number): number[] {
  const tops = [0];
  for (const row of rows) {
    let top = tops[tops.length - 1];
    if (row.bottom > top + pageHeight && row.top > top) {
      top = row.top;
      tops.push(top);
    }
    while (row.bottom > top + pageHeight) {
      top += pageHeight;
      tops.push(top);
    }
  }
  return tops;
}
