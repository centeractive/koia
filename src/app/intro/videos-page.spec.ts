import { expectFittingIntoViewport, findUnsafeExternalLinks, loadStaticPage, rowCountOf, textsOf } from 'app/shared/test';

describe('videos page', () => {

  const DESKTOP = 1280;
  const MEDIUM = 800;
  const MOBILE = 375;
  const TILE_SLUGS = ['new-scene', 'scenes-and-navigation', 'pivot-and-export', 'dashboards-and-charts', 'summary-tables', 'relationship-graphs'];  let iframe: HTMLIFrameElement;

  afterEach(() => iframe?.remove());

  async function loadVideos(width: number, scripts = false): Promise<Document> {
    iframe = await loadStaticPage('/intro/videos.html', { width, scripts });
    return iframe.contentDocument;
  }

  function all<T extends Element = HTMLElement>(doc: Document, selector: string): T[] {
    return Array.from(doc.querySelectorAll<T>(selector));
  }

  function dialogOf(button: HTMLElement): HTMLDialogElement {
    return button.ownerDocument.getElementById(button.getAttribute('commandfor')) as HTMLDialogElement;
  }

  /**
   * resolves after the toggle event task, since a toggle requested while that task runs is coalesced and not fired
   */
  function toggled(dialog: HTMLDialogElement): Promise<void> {
    return new Promise(resolve => dialog.addEventListener('toggle', () => setTimeout(resolve), { once: true }));
  }

  it('should reference koia stylesheets in fixed order followed by videos css', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    const hrefs = all(doc, 'link[rel=stylesheet]').map(l => l.getAttribute('href').split('/').pop());
    expect(hrefs).toEqual(['koia-tokens.css', 'koia-landing.css', 'intro.css', 'videos.css']);
  });

  it('should reference no scripts other than google tag', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    const external = all<HTMLScriptElement>(doc, 'script[src]');
    expect(all(doc, 'script').length).toBe(3);
    expect(external.length).toBe(1);
    expect(new URL(external[0].src).host).toBe('www.googletagmanager.com');
  });

  it('should title tile list with h2 placed before the grid', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    const heading = doc.querySelector('.landing-canvas .landing-container').firstElementChild;
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Topics');
    expect(heading.nextElementSibling.matches('ul.videos-grid')).toBe(true);
  });

  it('should show six video tiles with inline svg icon and expected titles', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    expect(textsOf(doc, '.video-tile h3')).toEqual(['Creating a new scene', 'Managing scenes and navigating',
      'Pivot tables and export', 'Dashboards and charts', 'Summary tables', 'Relationship graphs']);
    all(doc, '.video-tile').forEach(tile => expect(tile.querySelector('.landing-tile-head > svg.landing-tile-icon path')).not.toBeNull());
  });

  [[DESKTOP, 2], [MEDIUM, 3], [MOBILE, 6]].forEach(([width, rows]) => {

    it('should lay out tiles in ' + rows + ' rows at width ' + width, async () => {

      // when
      const doc = await loadVideos(width);

      // then
      expect(rowCountOf(doc, '.videos-grid > li')).toBe(rows);
    });
  });

  it('should offer play button on every tile', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    expect(all(doc, '.video-tile').map(t => t.querySelector('.video-play')?.getAttribute('commandfor')))
      .toEqual(TILE_SLUGS.map(slug => 'video-' + slug));
  });

  it('should open video in modal dialog closable by any', async () => {

    // given
    const doc = await loadVideos(DESKTOP);
    const button = doc.querySelector<HTMLElement>('.video-play');

    // when
    button.click();

    // then
    const dialog = dialogOf(button);
    expect(dialog.open).toBe(true);
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog.closedBy).toBe('any');
    expect(dialog.querySelector('video')).not.toBeNull();
  });

  it('should serve every referenced video and poster', async () => {

    // given
    const doc = await loadVideos(DESKTOP);
    const videos = all<HTMLVideoElement>(doc, 'video');

    // when
    const responses = await Promise.all(videos.flatMap(v => [fetch(v.src), fetch(v.poster)]));

    // then
    expect(responses.length).toBe(2 * TILE_SLUGS.length);
    responses.forEach(r => expect(r.ok).toBe(true));
    expect(responses.map(r => r.headers.get('content-type'))).toEqual(TILE_SLUGS.flatMap(() => ['video/webm', 'image/webp']));
  });

  it('should decode posters at 1280x720', async () => {

    // given
    const doc = await loadVideos(DESKTOP);

    for (const video of all<HTMLVideoElement>(doc, 'video')) {
      const poster = new Image();
      poster.src = video.poster;

      // when
      await poster.decode();

      // then
      expect([poster.naturalWidth, poster.naturalHeight]).toEqual([1280, 720]);
    }
  });

  it('should declare 1280x720 size attributes on videos', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    all(doc, 'video').forEach(v => expect([v.getAttribute('width'), v.getAttribute('height')]).toEqual(['1280', '720']));
  });

  [DESKTOP, MOBILE].forEach(width => {

    it('should fit video into viewport at width ' + width, async () => {

      // given
      const doc = await loadVideos(width);
      const button = doc.querySelector<HTMLElement>('.video-play');

      // when
      button.click();

      // then
      expectFittingIntoViewport(dialogOf(button).querySelector('video'), 0.85, 16 / 9);
    });
  });

  it('should play video when dialog opens', async () => {

    // given
    const doc = await loadVideos(DESKTOP, true);
    const button = doc.querySelector<HTMLElement>('.video-play');
    const dialog = dialogOf(button);
    const play = vi.spyOn(dialog.querySelector('video'), 'play').mockResolvedValue();
    const opened = toggled(dialog);

    // when
    button.click();
    await opened;

    // then
    expect(play).toHaveBeenCalled();
  });

  it('should pause and rewind video when dialog closes', async () => {

    // given
    const doc = await loadVideos(DESKTOP, true);
    const button = doc.querySelector<HTMLElement>('.video-play');
    const dialog = dialogOf(button);
    const video = dialog.querySelector('video');
    vi.spyOn(video, 'play').mockResolvedValue();
    const pause = vi.spyOn(video, 'pause');
    const opened = toggled(dialog);
    button.click();
    await opened;
    video.currentTime = 5;
    expect(video.currentTime).toBe(5);
    const closed = toggled(dialog);

    // when
    dialog.querySelector<HTMLElement>('.landing-zoom-close').click();
    await closed;

    // then
    expect(pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });

  it('should link back to intro and to front', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    expect(doc.querySelector('.landing-header-inner > a').getAttribute('href')).toBe('/intro/index.html');
    expect(doc.querySelector('.landing-nav a[href="index.html"]').textContent).toBe('Overview');
    expect(all(doc, 'a.landing-btn').map(a => a.getAttribute('href'))).toEqual(['/front']);
  });

  it('should credit soundtrack under creative commons by attribution 4.0', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    const credit = doc.querySelector('.landing-footer-inner > small.video-credit');
    const link = credit.querySelector('a');
    expect(credit.textContent.replace(/\s+/g, ' ')).toBe('Music: “The Entertainer” Kevin MacLeod (incompetech.com), composed by Scott Joplin, licensed under Creative Commons: By Attribution 4.0');
    expect([link.getAttribute('href'), link.target, link.rel]).toEqual(['https://creativecommons.org/licenses/by/4.0/', '_blank', 'noopener']);
  });

  it('should have no unsafe external links', async () => {

    // when
    const doc = await loadVideos(DESKTOP);

    // then
    expect(findUnsafeExternalLinks(doc)).toEqual([]);
  });
});
