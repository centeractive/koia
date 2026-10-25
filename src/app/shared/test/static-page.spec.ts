import { loadStaticPage } from './static-page';

describe('loadStaticPage', () => {

  let iframe: HTMLIFrameElement;

  afterEach(() => iframe?.remove());

  it('should load page in same origin sandbox without scripts', async () => {

    // when
    iframe = await loadStaticPage('/intro/index.html');

    // then
    expect(Array.from(iframe.sandbox)).toEqual(['allow-same-origin']);
  });

  it('should allow scripts when requested', async () => {

    // when
    iframe = await loadStaticPage('/intro/videos.html', { scripts: true });

    // then
    expect(Array.from(iframe.sandbox)).toEqual(['allow-same-origin', 'allow-scripts']);
  });

  it('should apply width and fixed height when width given', async () => {

    // when
    iframe = await loadStaticPage('/intro/index.html', { width: 375 });

    // then
    expect(iframe.style.width).toBe('375px');
    expect(iframe.style.height).toBe('800px');
  });

  it('should leave size unset when no width given', async () => {

    // when
    iframe = await loadStaticPage('/intro/index.html');

    // then
    expect(iframe.style.width).toBe('');
    expect(iframe.style.height).toBe('');
  });

  it('should resolve with iframe once page is loaded', async () => {

    // when
    iframe = await loadStaticPage('/intro/index.html');

    // then
    expect(iframe.contentDocument.readyState).toBe('complete');
    expect(iframe.contentWindow.location.pathname).toBe('/intro/index.html');
  });
});
