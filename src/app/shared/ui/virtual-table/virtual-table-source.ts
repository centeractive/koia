export interface VirtualTableSource {
  rowCount(): number | undefined;
  rowAt(index: number): object | undefined;
  requestRange(first: number, last: number): void;
}

export interface ColumnResize {
  index: number;
  width: number;
}
