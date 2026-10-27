import { TABLE_FONT_FAMILY, TABLE_FONT_SIZE } from 'app/shared/ui/table-fit/table-font';

export interface CellStyle {
  fontWeight: number;
  fontSize: number;
  fontFamily: string;
  letterSpacing: number;
  horizontalPadding: number;
}

const TABLE_CELL = { fontSize: TABLE_FONT_SIZE, fontFamily: TABLE_FONT_FAMILY, letterSpacing: 0, horizontalPadding: 12 };

/**
 * computed styles of the rendered summary table, e2e tests verify that they match the application theme
 */
export const SUMMARY_TABLE_STYLE = {
  header: { ...TABLE_CELL, fontWeight: 600 } as CellStyle,
  cell: { ...TABLE_CELL, fontWeight: 400 } as CellStyle,
  footer: { ...TABLE_CELL, fontWeight: 600 } as CellStyle,
  sortArrowWidth: 18,
  marginRight: 1,
  headerHeight: 23,
  firstRowHeight: 22,
  rowHeight: 23,
  footerHeight: 24,
  /** tile header plus resize handle around the table scroller */
  scrollerInset: 64
};

export function fontOf(style: CellStyle): string {
  return `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
}
