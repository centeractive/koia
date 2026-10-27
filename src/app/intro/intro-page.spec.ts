import { expectFittingIntoViewport, findStyleRule, findUnsafeExternalLinks, lineCountOf, loadStaticPage, rightInsetOf } from 'app/shared/test';

describe('intro page', () => {

  const DESKTOP = 1280;
  const MEDIUM = 800;
  const MOBILE = 375;
  let iframe: HTMLIFrameElement;

  afterEach(() => iframe?.remove());

  async function loadIntro(width: number): Promise<Document> {
    iframe = await loadStaticPage('/intro/index.html', { width });
    return iframe.contentDocument;
  }

  function styleOf(doc: Document, selector: string): CSSStyleDeclaration {
    return doc.defaultView.getComputedStyle(doc.querySelector(selector));
  }

  function all(doc: Document, selector: string): HTMLElement[] {
    return Array.from(doc.querySelectorAll<HTMLElement>(selector));
  }

  function scrollerOf(doc: Document): HTMLElement {
    return doc.querySelector<HTMLElement>('.landing-scroll');
  }

  function tops(elements: HTMLElement[]): number[] {
    return elements.map(e => e.getBoundingClientRect().top);
  }

  it('should have exactly one h1 headline', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelectorAll('h1').length).toBe(1);
  });

  it('should reference no scripts other than google tag', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const scripts = all(doc, 'script[src]') as HTMLScriptElement[];
    expect(scripts.length).toBe(1);
    expect(new URL(scripts[0].src).host).toBe('www.googletagmanager.com');
  });

  it('should show pivot tables and dashboards headline', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelector('h1').textContent).toBe('Pivot tables and dashboards from your data');
  });

  it('should promise in hero that data is never sent to third-party servers', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelector('.landing-lead').textContent).toContain('never sent to any third-party server');
  });

  it('should promise in hero one click from chart element to its rows', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelector('.landing-lead').textContent).toContain('One click on a chart element shows the rows behind it.');
  });

  it('should name every clickable element in raw data showcase', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const row = all(doc, '.landing-showcase-row').find(r => r.querySelector('h3').textContent === 'Drill into raw data');
    expect(row.querySelector('p').textContent).toContain('chart element, pivot table value or summary table count');
  });

  it('should list privacy first and environment last among why koia tiles', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(all(doc, '#why h3').map(h => h.textContent))
      .toEqual(['Your data stays private', 'Open-source', 'CSV, Excel, JSON, logs', 'Data never leaves your environment']);
  });

  it('should fit last why koia tile heading on two lines', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(lineCountOf(doc.querySelector('#why li:last-child h3'))).toBeLessThanOrEqual(2);
  });

  it('should promise in last why koia tile that data never leaves trusted environment', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const text = doc.querySelector('#why li:last-child p').textContent;
    expect(text).toContain('never leaves your trusted environment');
    expect(text).toContain('Optionally, store it in your own CouchDB over HTTPS.');
    expect(text).not.toContain('no tracking');
  });

  it('should not show how it works section', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.getElementById('how')).toBeNull();
    expect(doc.querySelector('a[href="#how"]')).toBeNull();
  });

  it('should link every call to action to front', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(all(doc, 'a.landing-btn').map(l => l.getAttribute('href')))
      .toEqual(['/front', '/front', '/front']);
  });

  it('should label every call to action open koia in strong accent', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const buttons = all(doc, 'a.landing-btn');
    expect(buttons.map(b => b.textContent)).toEqual(['Open Koia', 'Open Koia', 'Open Koia']);
    buttons.forEach(b => {
      expect(b.classList).toContain('landing-btn-accent');
      expect(doc.defaultView.getComputedStyle(b).backgroundColor).toBe('rgb(46, 125, 50)');
    });
  });

  it('should not link outdated video', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(all(doc, 'a[href*="youtu"]')).toEqual([]);
  });

  it('should link videos page from nav and hero', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelector('.landing-nav a.landing-nav-secondary[href="videos.html"]').textContent).toBe('Videos');
    expect(doc.querySelector('.landing-hero .intro-videos-link a[href="videos.html"]').textContent).toBe('Watch short videos');
  });

  it('should show hero videos link in on-color', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.intro-videos-link a').color).toBe('rgb(255, 255, 255)');
  });

  it('should keep hero videos link visible on mobile', async () => {

    // when
    const doc = await loadIntro(MOBILE);

    // then
    const link = doc.querySelector('.intro-videos-link a');
    expect(doc.defaultView.getComputedStyle(link).display).not.toBe('none');
    expect(link.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it('should place hero videos link 16px below actions and 40px above screenshot', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const link = doc.querySelector('.intro-videos-link').getBoundingClientRect();
    expect(link.top - doc.querySelector('.landing-hero .landing-actions').getBoundingClientRect().bottom).toBeCloseTo(16, 0);
    expect(doc.querySelector('.landing-hero-shot').getBoundingClientRect().top - link.bottom).toBeCloseTo(40, 0);
  });

  it('should outline focused hero videos link in on-color', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const rule = findStyleRule(Array.from(doc.styleSheets), '.intro-videos-link a:focus-visible');

    // then
    expect(rule.style.outlineWidth).toBe('2px');
    expect(rule.style.outlineStyle).toBe('solid');
    expect(rule.style.outlineOffset).toBe('2px');
    expect(rule.style.getPropertyValue('outline-color')).toBe('var(--koia-on-color)');
  });

  it('should keep header nav on one line at medium width', async () => {

    // when
    const doc = await loadIntro(MEDIUM);

    // then
    all(doc, '.landing-nav > a, .landing-nav > details > summary').forEach(label => expect(lineCountOf(label)).toBe(1));
    expect(rightInsetOf(doc.querySelector('.intro-languages summary'), doc.querySelector('.landing-header'))).toBe(8);
  });

  it('should open external links in new tab without opener', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(findUnsafeExternalLinks(doc)).toEqual([]);
  });

  it('should load every image with alt attribute and intrinsic size', async () => {

    // given
    const doc = await loadIntro(DESKTOP);
    const images = all(doc, 'img') as HTMLImageElement[];

    // when
    images.forEach(img => img.loading = 'eager');
    await Promise.all(images.map(img => img.decode()));

    // then
    images.forEach(img => {
      expect(img.hasAttribute('alt')).toBe(true);
      expect(img.hasAttribute('width')).toBe(true);
      expect(img.hasAttribute('height')).toBe(true);
      expect(img.naturalWidth).toBeGreaterThan(0);
    });
    images.filter(img => !img.classList.contains('landing-tile-icon'))
      .forEach(img => expect(img.alt).not.toBe(''));
  });

  it('should reuse shared koia logo in header', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const logo = doc.querySelector<HTMLImageElement>('header .landing-logo');
    expect(new URL(logo.src).pathname).toBe('/assets/koialogo_textblack.png');
  });

  it('should size header logo to 40px height keeping aspect ratio', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const rect = doc.querySelector('header .landing-logo').getBoundingClientRect();
    expect(rect.height).toBe(40);
    expect(Math.round(rect.width)).toBe(84);
  });

  it('should size feature icons to 40px square', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const icons = all(doc, '.landing-tile-icon');
    expect(icons.length).toBe(4);
    icons.forEach(i => {
      expect(i.getBoundingClientRect().width).toBe(40);
      expect(i.getBoundingClientRect().height).toBe(40);
    });
  });

  it('should style zoom close button with shared koia primary token', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.landing-zoom-close').backgroundColor).toBe('rgb(48, 63, 159)');
  });

  it('should style hero call to action with strong accent', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const style = styleOf(doc, '.landing-hero .landing-btn-accent');
    expect(style.backgroundColor).toBe('rgb(46, 125, 50)');
    expect(style.color).toBe('rgb(255, 255, 255)');
  });

  it('should separate hero actions by gap', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.landing-actions').columnGap).toBe('12px');
  });

  it('should paint hero with primary gradient', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const backgroundImage = styleOf(doc, '.landing-hero').backgroundImage;
    expect(backgroundImage).toContain('linear-gradient');
    expect(backgroundImage).toContain('rgb(48, 63, 159)');
    expect(backgroundImage).toContain('rgb(26, 35, 126)');
  });

  it('should close features with centered call to action', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelector('#features > .landing-actions > a.landing-btn-accent').getAttribute('href')).toBe('/front');
    expect(styleOf(doc, '#features > .landing-actions').justifyContent).toBe('center');
  });

  it('should outline focused button in contrasting color', async () => {

    // given
    const doc = await loadIntro(DESKTOP);
    const sheets = Array.from(doc.styleSheets);

    // when
    const rule = findStyleRule(sheets, '.landing-btn:focus-visible, .landing-zoom:focus-visible');
    const onPrimaryRule = findStyleRule(sheets, '.landing-hero .landing-btn:focus-visible');

    // then
    expect(rule.style.outlineWidth).toBe('2px');
    expect(rule.style.outlineStyle).toBe('solid');
    expect(rule.style.outlineOffset).toBe('2px');
    expect(rule.style.getPropertyValue('outline-color')).toBe('var(--koia-primary-dark)');
    expect(onPrimaryRule.style.getPropertyValue('outline-color')).toBe('var(--koia-on-color)');
  });

  it('should scroll smoothly unless reduced motion is preferred', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const rule = findStyleRule(Array.from(doc.styleSheets), '.landing-scroll', '(prefers-reduced-motion: no-preference)');

    // then
    expect(rule.style.scrollBehavior).toBe('smooth');
  });

  it('should limit content width by container', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.landing-container').maxWidth).toBe('1200px');
  });

  it('should show language menu at right end of header', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.querySelector('.landing-nav').lastElementChild.matches('details.intro-languages')).toBe(true);
    expect(rightInsetOf(doc.querySelector('.intro-languages summary'), doc.querySelector('.landing-header'))).toBe(8);
  });

  it('should frame screenshots with rounded shadowed border', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const style = styleOf(doc, '.landing-showcase-row .landing-frame');
    expect(style.boxShadow).toBe('rgba(0, 0, 0, 0.18) 0px 12px 32px 0px');
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.marginLeft).toBe('0px');
  });

  it('should keep header pinned to top when content is scrolled', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    scrollerOf(doc).scrollTo({ top: 1000, behavior: 'instant' });

    // then
    expect(scrollerOf(doc).scrollTop).toBe(1000);
    expect(doc.querySelector('.landing-header').getBoundingClientRect().top).toBe(0);
  });

  it('should scroll features anchor to top of content below header', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    doc.getElementById('features').scrollIntoView({ behavior: 'instant' });

    // then
    const headerBottom = doc.querySelector('.landing-header').getBoundingClientRect().bottom;
    expect(doc.getElementById('features').getBoundingClientRect().top).toBeCloseTo(headerBottom, 0);
  });

  it('should keep scrollbar below header', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const scroller = scrollerOf(doc).getBoundingClientRect();
    expect(scroller.top).toBeCloseTo(doc.querySelector('.landing-header').getBoundingClientRect().bottom, 0);
    expect(scroller.bottom).toBe(doc.defaultView.innerHeight);
    expect(doc.documentElement.scrollHeight).toBe(doc.documentElement.clientHeight);
  });

  it('should paint header above scrolled content', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const style = styleOf(doc, '.landing-header');
    expect(style.position).toBe('relative');
    expect(style.zIndex).toBe('1');
  });

  it('should load shared landing stylesheet between tokens and intro stylesheet', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const hrefs = all(doc, 'link[rel=stylesheet]').map(l => l.getAttribute('href').split('/').pop());
    expect(hrefs).toEqual(['koia-tokens.css', 'koia-landing.css', 'intro.css']);
  });

  it('should show secondary navigation on desktop', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    all(doc, '.landing-nav-secondary').forEach(l => expect(doc.defaultView.getComputedStyle(l).display).not.toBe('none'));
  });

  it('should hide secondary navigation on mobile', async () => {

    // when
    const doc = await loadIntro(MOBILE);

    // then
    all(doc, '.landing-nav-secondary').forEach(l => expect(doc.defaultView.getComputedStyle(l).display).toBe('none'));
  });

  it('should show secondary navigation in secondary text color', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.landing-nav-secondary').color).toBe('rgba(0, 0, 0, 0.6)');
  });

  it('should lay out feature tiles in one row on desktop', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(new Set(tops(all(doc, '.landing-grid-4 > .landing-tile'))).size).toBe(1);
  });

  it('should align feature tile icons and texts on desktop', async () => {

    // given
    const doc = await loadIntro(DESKTOP);
    const titleHeights = all(doc, '.landing-grid-4 h3').map(h => h.getBoundingClientRect().height);

    // when
    const iconTops = tops(all(doc, '.landing-grid-4 .landing-tile-icon'));
    const textTops = tops(all(doc, '.landing-grid-4 .landing-tile > p'));

    // then
    expect(new Set(titleHeights).size).toBeGreaterThan(1);
    expect(new Set(iconTops).size).toBe(1);
    expect(new Set(textTops).size).toBe(1);
  });

  it('should lay out feature tiles in two rows on medium screens', async () => {

    // when
    const doc = await loadIntro(MEDIUM);

    // then
    const [first, second, third, fourth] = tops(all(doc, '.landing-grid-4 > .landing-tile'));
    expect(second).toBe(first);
    expect(fourth).toBe(third);
    expect(third).toBeGreaterThan(first);
  });

  it('should stack feature tiles on mobile', async () => {

    // when
    const doc = await loadIntro(MOBILE);

    // then
    const rects = all(doc, '.landing-grid-4 > .landing-tile').map(t => t.getBoundingClientRect());
    rects.slice(1).forEach((r, i) => expect(r.top).toBeGreaterThanOrEqual(rects[i].bottom));
  });

  it('should give screenshot the wide column on alternating sides on desktop', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    all(doc, '.landing-showcase-row').forEach((row, i) => {
      const figure = row.querySelector('figure').getBoundingClientRect();
      const text = row.querySelector('.landing-showcase-text').getBoundingClientRect();
      const rowNumber = i + 1;
      if (rowNumber % 2 === 0) {
        expect(figure.left).toBeLessThan(text.left);
      } else {
        expect(figure.left).toBeGreaterThan(text.left);
      }
      expect(figure.width).toBeGreaterThan(text.width);
    });
  });

  it('should stack showcase text above screenshot on mobile', async () => {

    // when
    const doc = await loadIntro(MOBILE);

    // then
    all(doc, '.landing-showcase-row').forEach(row => {
      const figure = row.querySelector('figure').getBoundingClientRect();
      const text = row.querySelector('.landing-showcase-text').getBoundingClientRect();
      expect(text.bottom).toBeLessThanOrEqual(figure.top);
    });
  });

  it('should render footer on canvas with top border', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const style = styleOf(doc, '.landing-footer');
    expect(style.backgroundColor).toBe('rgb(236, 239, 241)');
    expect(style.borderTopWidth).toBe('1px');
  });

  it('should not scroll horizontally on mobile', async () => {

    // when
    const doc = await loadIntro(MOBILE);

    // then
    expect(scrollerOf(doc).scrollWidth).toBe(scrollerOf(doc).clientWidth);
  });

  it('should center hero screenshot on desktop', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const figure = doc.querySelector<HTMLElement>('.landing-hero-shot');
    const container = figure.parentElement;
    const containerStyle = doc.defaultView.getComputedStyle(container);
    const contentLeft = container.getBoundingClientRect().left + parseFloat(containerStyle.paddingLeft);
    const contentRight = container.getBoundingClientRect().right - parseFloat(containerStyle.paddingRight);
    const rect = figure.getBoundingClientRect();
    expect(doc.defaultView.getComputedStyle(figure).marginLeft).not.toBe('0px');
    expect(rect.left - contentLeft).toBeCloseTo(contentRight - rect.right, 0);
  });

  it('should declare English document language', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(doc.documentElement.lang).toBe('en');
    expect(doc.doctype.name).toBe('html');
  });

  it('should define landing tokens on intro root', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const style = doc.defaultView.getComputedStyle(doc.documentElement);

    // then
    expect(style.getPropertyValue('--koia-primary-dark').trim()).toBe('#1a237e');
    expect(style.getPropertyValue('--koia-accent-strong').trim()).toBe('#2e7d32');
    expect(style.getPropertyValue('--koia-radius-tile').trim()).toBe('12px');
    expect(style.getPropertyValue('--koia-radius-button').trim()).toBe('8px');
    expect(style.getPropertyValue('--koia-tile-shadow').trim()).toBe('0 1px 3px rgba(0, 0, 0, 0.12)');
    expect(style.getPropertyValue('--koia-frame-shadow').trim()).toBe('0 12px 32px rgba(0, 0, 0, 0.18)');
    expect(style.getPropertyValue('--koia-font-landing').replace(/\s+/g, ' ').trim())
      .toBe('system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
  });

  it('should show four showcase rows in order', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const titles = all(doc, '.landing-showcase-row h3').map(h => h.textContent);

    // then
    expect(titles).toEqual(['Load your data', 'Pivot tables and charts', 'Dashboards', 'Drill into raw data']);
  });

  it('should show screenshots in uniform 16:10 frames', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const thumbnails = all(doc, '.landing-zoom > img');

    // then
    expect(thumbnails.length).toBe(5);
    thumbnails.forEach(img => {
      const rect = img.getBoundingClientRect();
      expect(rect.width / rect.height).toBeCloseTo(1.6, 2);
    });
  });

  it('should render tile icons as inline svg in primary color', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    const icons = all(doc, 'svg.landing-tile-icon');
    expect(icons.length).toBe(4);
    icons.forEach(i => {
      expect(i.getAttribute('aria-hidden')).toBe('true');
      expect(doc.defaultView.getComputedStyle(i).color).toBe('rgb(48, 63, 159)');
    });
  });

  it('should pair every screenshot with zoom dialog showing same image', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const buttons = all(doc, 'figure .landing-zoom');

    // then
    expect(buttons.length).toBe(5);
    buttons.forEach(button => {
      const thumbnail = button.querySelector('img');
      const dialog = zoomDialogOf(button);
      const enlarged = dialog.querySelector('img');
      expect(button.getAttribute('command')).toBe('show-modal');
      expect(dialog.getAttribute('aria-label')).toBe(thumbnail.alt);
      expect(enlarged.src).toBe(thumbnail.src);
      expect(enlarged.alt).toBe(thumbnail.alt);
    });
  });

  it('should open zoom dialog modally when screenshot is clicked', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    all(doc, 'figure .landing-zoom').forEach(button => {
      const dialog = zoomDialogOf(button);

      // when
      button.click();

      // then
      expect(dialog.open).toBe(true);
      expect(dialog.matches(':modal')).toBe(true);
      dialog.close();
    });
  });

  it('should close zoom dialog when close button is clicked', async () => {

    // given
    const doc = await loadIntro(DESKTOP);
    const button = doc.querySelector<HTMLElement>('.landing-hero .landing-zoom');
    const dialog = zoomDialogOf(button);
    button.click();

    // when
    dialog.querySelector<HTMLElement>('.landing-zoom-close').click();

    // then
    expect(dialog.open).toBe(false);
  });

  it('should close zoom dialog on backdrop click', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    all(doc, '.landing-zoom-dialog').forEach(dialog => expect((dialog as HTMLDialogElement).closedBy).toBe('any'));
  });

  it('should show zoom-in cursor on screenshots', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.landing-zoom').cursor).toBe('zoom-in');
  });

  it('should fit enlarged screenshot into viewport on desktop', async () => {

    // given
    const doc = await loadIntro(DESKTOP);
    const button = doc.querySelector<HTMLElement>('.landing-hero .landing-zoom');
    const img = await loadedEnlargedImageOf(button);

    // when
    button.click();

    // then
    expectFittingIntoViewport(img, 0.9, img.naturalWidth / img.naturalHeight);
    expect(img.getBoundingClientRect().width).toBeGreaterThan(button.getBoundingClientRect().width);
  });

  it('should fit enlarged screenshot into viewport on mobile', async () => {

    // given
    const doc = await loadIntro(MOBILE);
    const button = doc.querySelector<HTMLElement>('.landing-hero .landing-zoom');
    const img = await loadedEnlargedImageOf(button);

    // when
    button.click();

    // then
    expectFittingIntoViewport(img, 0.9, img.naturalWidth / img.naturalHeight);
  });

  it('should outline focused close button in primary dark inside hero dialog', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const rule = findStyleRule(Array.from(doc.styleSheets), '.landing-zoom-dialog .landing-btn:focus-visible');

    // then
    expect(rule.style.getPropertyValue('outline-color')).toBe('var(--koia-primary-dark)');
  });

  it('should inset focus outline of zoom button', async () => {

    // given
    const doc = await loadIntro(DESKTOP);

    // when
    const rule = findStyleRule(Array.from(doc.styleSheets), '.landing-zoom:focus-visible');

    // then
    expect(rule.style.outlineOffset).toBe('-4px');
  });

  it('should blend retrospective badge into footer', async () => {

    // when
    const doc = await loadIntro(DESKTOP);

    // then
    expect(styleOf(doc, '.landing-footer .landing-badge').mixBlendMode).toBe('multiply');
  });

  function zoomDialogOf(button: HTMLElement): HTMLDialogElement {
    return button.ownerDocument.getElementById(button.getAttribute('commandfor')) as HTMLDialogElement;
  }

  async function loadedEnlargedImageOf(button: HTMLElement): Promise<HTMLImageElement> {
    const img = zoomDialogOf(button).querySelector('img');
    img.loading = 'eager';
    await img.decode();
    return img;
  }
});
