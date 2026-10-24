/**
 * @returns true when the element is in the document and has a layout box, i.e. neither it nor an ancestor has display none
 */
export function isRendered(element: Element | undefined): boolean {
   return !!element?.isConnected && element.getClientRects().length > 0;
}
