export class ColumnAutoSizer {

  static readonly PADDING = 13;
  static readonly MIN = 40;
  static readonly MAX = 400;

  static width(texts: string[], measure: (text: string) => number): number {
    const lineWidths = texts.flatMap(text => text.split('\n')).map(line => measure(line));
    const contentWidth = Math.ceil(Math.max(0, ...lineWidths)) + ColumnAutoSizer.PADDING;
    return Math.min(ColumnAutoSizer.MAX, Math.max(ColumnAutoSizer.MIN, contentWidth));
  }
}
