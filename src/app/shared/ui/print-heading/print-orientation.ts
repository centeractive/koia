export const PORTRAIT_PRINT_CLASS = 'koia-print-portrait';

export function applyPrintOrientation(document: Document, portrait: boolean): void {
  document.documentElement.classList.toggle(PORTRAIT_PRINT_CLASS, portrait);
}

export function resetPrintOrientation(document: Document): void {
  document.documentElement.classList.remove(PORTRAIT_PRINT_CLASS);
}
