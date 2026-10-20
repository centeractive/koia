import { CanvasPaging } from 'app/shared/model';
import { applyPrintSheets, resetPrintSheets, SHEET_PRINT_CLASSES } from './print-sheets';

describe('print sheets', () => {

  afterEach(() => resetPrintSheets(document));

  function sheetClasses(): string[] {
    return Object.values(SHEET_PRINT_CLASSES).filter(c => document.documentElement.classList.contains(c));
  }

  it.each([
    { paging: CanvasPaging.LANDSCAPE, sheetClass: 'koia-print-sheet-landscape' },
    { paging: CanvasPaging.PORTRAIT, sheetClass: 'koia-print-sheet-portrait' }
  ])('should mark document for printing $paging sheets', ({ paging, sheetClass }) => {

    // when
    applyPrintSheets(document, paging);

    // then
    expect(sheetClasses()).toEqual([sheetClass]);
  });

  it('should replace sheets of other paging', () => {

    // given
    applyPrintSheets(document, CanvasPaging.PORTRAIT);

    // when
    applyPrintSheets(document, CanvasPaging.LANDSCAPE);

    // then
    expect(sheetClasses()).toEqual(['koia-print-sheet-landscape']);
  });

  it.each([undefined, CanvasPaging.NONE])('should not mark document for printing sheets of paging %s', paging => {

    // given
    applyPrintSheets(document, CanvasPaging.PORTRAIT);

    // when
    applyPrintSheets(document, paging);

    // then
    expect(sheetClasses()).toEqual([]);
    expect(document.documentElement.classList.contains('undefined')).toBe(false);
  });

  it('should reset printing sheets', () => {

    // given
    applyPrintSheets(document, CanvasPaging.LANDSCAPE);

    // when
    resetPrintSheets(document);

    // then
    expect(sheetClasses()).toEqual([]);
  });
});
