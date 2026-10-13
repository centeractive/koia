import { findUnsafeExternalLinks } from './external-links';

describe('findUnsafeExternalLinks', () => {

  function createRoot(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
  }

  it('should return no links when all external links open in new tab without opener', () => {

    // given
    const root = createRoot('<a href="https://a.com" target="_blank" rel="noopener">a</a>');

    // when
    const links = findUnsafeExternalLinks(root);

    // then
    expect(links).toEqual([]);
  });

  it('should return external link without blank target', () => {

    // given
    const root = createRoot('<a id="link" href="https://a.com" rel="noopener">a</a>');

    // when
    const links = findUnsafeExternalLinks(root);

    // then
    expect(links.map(l => l.id)).toEqual(['link']);
  });

  it('should return external link without noopener', () => {

    // given
    const root = createRoot('<a id="no_rel" href="https://a.com" target="_blank">a</a>'
      + '<a id="other_rel" href="https://b.com" target="_blank" rel="noreferrer">b</a>');

    // when
    const links = findUnsafeExternalLinks(root);

    // then
    expect(links.map(l => l.id)).toEqual(['no_rel', 'other_rel']);
  });

  it('should ignore relative links', () => {

    // given
    const root = createRoot('<a href="/front">a</a>');

    // when
    const links = findUnsafeExternalLinks(root);

    // then
    expect(links).toEqual([]);
  });
});
