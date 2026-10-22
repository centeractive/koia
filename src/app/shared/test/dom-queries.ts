export function textsOf(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map(e => e.textContent.replace(/\s+/g, ' ').trim());
}

export function rowCountOf(root: ParentNode, selector: string): number {
  return new Set(Array.from(root.querySelectorAll(selector)).map(e => e.getBoundingClientRect().top)).size;
}

export function stylesOf(root: ParentNode, selector: string): CSSStyleDeclaration[] {
  return Array.from(root.querySelectorAll(selector)).map(e => getComputedStyle(e));
}

export function rightInsetOf(element: Element, container: Element): number {
  return container.getBoundingClientRect().right - element.getBoundingClientRect().right;
}
