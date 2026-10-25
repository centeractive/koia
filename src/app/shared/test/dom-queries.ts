export function textsOf(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map(e => e.textContent.replace(/\s+/g, ' ').trim());
}

export function rowCountOf(root: ParentNode, selector: string): number {
  return new Set(Array.from(root.querySelectorAll(selector)).map(e => e.getBoundingClientRect().top)).size;
}

export function stylesOf(root: ParentNode, selector: string): CSSStyleDeclaration[] {
  return Array.from(root.querySelectorAll(selector)).map(e => getComputedStyle(e));
}

export function leftInsetOf(element: Element, container: Element): number {
  return element.getBoundingClientRect().left - container.getBoundingClientRect().left;
}

export function rightInsetOf(element: Element, container: Element): number {
  return container.getBoundingClientRect().right - element.getBoundingClientRect().right;
}

export function lineCountOf(element: Element): number {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  return new Set(Array.from(range.getClientRects()).map(r => Math.round(r.top))).size;
}

export function expectFittingIntoViewport(element: HTMLElement, maxHeightShare: number, aspectRatio: number): void {
  const view = element.ownerDocument.defaultView;
  const rect = element.getBoundingClientRect();
  expect(rect.width).toBeLessThanOrEqual(view.innerWidth * 0.95 + 0.5);
  expect(rect.height).toBeLessThanOrEqual(view.innerHeight * maxHeightShare + 0.5);
  expect(element.offsetWidth).toBeLessThanOrEqual(element.closest('dialog').clientWidth);
  expect(rect.width / rect.height).toBeCloseTo(aspectRatio, 1);
}
