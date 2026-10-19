import { applyPrintOrientation, PORTRAIT_PRINT_CLASS, resetPrintOrientation } from './print-orientation';

describe('print orientation', () => {

  afterEach(() => resetPrintOrientation(document));

  function isPortrait(): boolean {
    return document.documentElement.classList.contains(PORTRAIT_PRINT_CLASS);
  }

  it('should mark document for portrait printing', () => {

    // when
    applyPrintOrientation(document, true);

    // then
    expect(isPortrait()).toBe(true);
  });

  it('should unmark document for landscape printing', () => {

    // given
    applyPrintOrientation(document, true);

    // when
    applyPrintOrientation(document, false);

    // then
    expect(isPortrait()).toBe(false);
  });

  it('should reset portrait printing', () => {

    // given
    applyPrintOrientation(document, true);

    // when
    resetPrintOrientation(document);

    // then
    expect(isPortrait()).toBe(false);
  });
});
