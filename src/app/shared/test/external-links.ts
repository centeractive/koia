export function findUnsafeExternalLinks(root: ParentNode): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="http"]'))
    .filter(a => a.getAttribute('target') !== '_blank' || !(a.getAttribute('rel') ?? '').split(/\s+/).includes('noopener'));
}
