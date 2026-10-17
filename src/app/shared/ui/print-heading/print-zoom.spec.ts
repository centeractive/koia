import { fitPrintableContentToPage, PRINT_ZOOM_PROPERTY, resetPrintZoom } from './print-zoom';

describe('print zoom', () => {

  let viewRoot: HTMLDivElement;
  let outside: HTMLDivElement;

  beforeEach(() => {
    viewRoot = document.createElement('div');
    viewRoot.style.width = '2400px';
    document.body.appendChild(viewRoot);
  });

  afterEach(() => {
    viewRoot.remove();
    outside?.remove();
    resetPrintZoom(document);
  });

  function printable(widthPx: number, parent: HTMLElement = viewRoot): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'printable';
    element.style.width = widthPx + 'px';
    element.style.height = '10px';
    parent.appendChild(element);
    return element;
  }

  function wrapper(style: string): HTMLDivElement {
    const element = document.createElement('div');
    element.setAttribute('style', style);
    viewRoot.appendChild(element);
    return element;
  }

  function printZoom(): string {
    return document.documentElement.style.getPropertyValue(PRINT_ZOOM_PROPERTY);
  }

  it('should zoom widest printable content to page width', () => {

    // given
    printable(1960);
    printable(1000);

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe('0.5');
  });

  it('should not enlarge printable content narrower than page', () => {

    // given
    printable(500);

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe('1');
  });

  it('should keep space around printable content unzoomed', () => {

    // given
    printable(1960, wrapper('padding: 0 10px'));

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe(String((980 - 20) / 1960));
  });

  it('should ignore horizontal scrolling of ancestors', () => {

    // given
    const scroller = wrapper('overflow: auto; width: 800px; padding: 0 10px');
    printable(1960, scroller);
    scroller.scrollLeft = 500;

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(scroller.scrollLeft).toBe(500);
    expect(printZoom()).toBe(String((980 - 20) / 1960));
  });

  it('should ignore horizontal scrolling of view root', () => {

    // given
    viewRoot.style.overflow = 'hidden';
    printable(3000);
    viewRoot.scrollLeft = 300;

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(viewRoot.scrollLeft).toBe(300);
    expect(printZoom()).toBe(String(980 / 3000));
  });

  it('should zoom margins of printable content', () => {

    // given
    printable(1960).style.margin = '0 10px';

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe(String(980 / 1980));
  });

  it('should ignore printable content not displayed', () => {

    // given
    printable(3920).style.display = 'none';
    printable(1960);

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe('0.5');
  });

  it('should ignore printable content outside view root', () => {

    // given
    outside = printable(3920, document.body);
    printable(1960);

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe('0.5');
  });

  it('should not set zoom when no printable content is displayed', () => {

    // given
    printable(1960).style.display = 'none';

    // when
    fitPrintableContentToPage(viewRoot);

    // then
    expect(printZoom()).toBe('');
  });

  it('should remove zoom on reset', () => {

    // given
    printable(1960);
    fitPrintableContentToPage(viewRoot);

    // when
    resetPrintZoom(document);

    // then
    expect(printZoom()).toBe('');
  });
});
