export const PRINT_ZOOM_PROPERTY = '--koia-print-zoom';

/** printable width of landscape Letter with 10mm page margins, landscape A4 is wider */
export const PRINTABLE_PAGE_WIDTH_PX = 980;

export function fitPrintableContentToPage(viewRoot: HTMLElement): void {
  const zooms = Array.from(viewRoot.querySelectorAll<HTMLElement>('.printable'))
    .filter(element => element.getClientRects().length > 0)
    .map(element => zoomFitting(element, viewRoot));
  if (zooms.length) {
    viewRoot.ownerDocument.documentElement.style.setProperty(PRINT_ZOOM_PROPERTY, String(Math.min(1, ...zooms)));
  }
}

export function resetPrintZoom(document: Document): void {
  document.documentElement.style.removeProperty(PRINT_ZOOM_PROPERTY);
}

function zoomFitting(element: HTMLElement, viewRoot: HTMLElement): number {
  const style = getComputedStyle(element);
  const marginLeft = parseFloat(style.marginLeft);
  const marginRight = parseFloat(style.marginRight);
  const offset = unscrolledLeft(element, viewRoot) - marginLeft;
  return (PRINTABLE_PAGE_WIDTH_PX - 2 * offset) / (element.scrollWidth + marginLeft + marginRight);
}

function unscrolledLeft(element: HTMLElement, viewRoot: HTMLElement): number {
  let scrolled = viewRoot.scrollLeft;
  for (let ancestor = element.parentElement; ancestor !== viewRoot; ancestor = ancestor.parentElement) {
    scrolled += ancestor.scrollLeft;
  }
  return element.getBoundingClientRect().left + scrolled - viewRoot.getBoundingClientRect().left;
}
