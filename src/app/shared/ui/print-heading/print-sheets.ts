import { CanvasPaging } from 'app/shared/model/canvas-paging.enum';

/** classes of the document selecting the named page of the printed sheets */
export const SHEET_PRINT_CLASSES: Partial<Record<CanvasPaging, string>> = {
  [CanvasPaging.LANDSCAPE]: 'koia-print-sheet-landscape',
  [CanvasPaging.PORTRAIT]: 'koia-print-sheet-portrait'
};

export function applyPrintSheets(document: Document, paging: CanvasPaging | undefined): void {
  resetPrintSheets(document);
  const sheetClass = SHEET_PRINT_CLASSES[paging];
  if (sheetClass) {
    document.documentElement.classList.add(sheetClass);
  }
}

export function resetPrintSheets(document: Document): void {
  document.documentElement.classList.remove(...Object.values(SHEET_PRINT_CLASSES));
}
