export interface CellStyle {
  fontWeight: number;
  fontSize: number;
  fontFamily: string;
  letterSpacing: number;
  horizontalPadding: number;
}

/**
 * computed styles of the rendered summary table, e2e tests verify that they match the application theme
 */
export const SUMMARY_TABLE_STYLE = {
  header: { fontWeight: 500, fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: 0, horizontalPadding: 16 } as CellStyle,
  cell: { fontWeight: 400, fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: 0, horizontalPadding: 10 } as CellStyle,
  footer: { fontWeight: 700, fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: 0.25, horizontalPadding: 15 } as CellStyle,
  sortArrowWidth: 18,
  marginRight: 1
};

export function fontOf(style: CellStyle): string {
  return `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
}
