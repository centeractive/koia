import { CanvasPaging } from 'app/shared/model';
import { PageFormat } from './page-format';

describe('PageFormat', () => {

  const A4_LONG_PX = 297 / 25.4 * 96;
  const A4_SHORT_PX = 210 / 25.4 * 96;

  it.each([
    { paging: CanvasPaging.LANDSCAPE, format: PageFormat.LANDSCAPE },
    { paging: CanvasPaging.PORTRAIT, format: PageFormat.PORTRAIT },
    { paging: CanvasPaging.NONE, format: PageFormat.UNPAGED },
    { paging: undefined, format: PageFormat.LANDSCAPE }
  ])('#of should return format of paging $paging', ({ paging, format }) => {

    // when
    const result = PageFormat.of(paging);

    // then
    expect(result).toBe(format);
  });

  it.each([
    { format: PageFormat.LANDSCAPE, expected: [CanvasPaging.LANDSCAPE, 1400, 950, true, 1120] },
    { format: PageFormat.PORTRAIT, expected: [CanvasPaging.PORTRAIT, 950, 1400, true, 791] },
    { format: PageFormat.UNPAGED, expected: [CanvasPaging.NONE, 1400, 950, false, 970] }
  ])('should define size and print width of $format.paging format', ({ format, expected }) => {

    // when
    const result = [format.paging, format.width, format.height, format.paged, format.printWidthPx];

    // then
    expect(result).toEqual(expected);
  });

  it.each([
    { format: PageFormat.LANDSCAPE, sheet: [1616.305, 1142.842], margins: [108.153, 54.421] },
    { format: PageFormat.PORTRAIT, sheet: [1125.054, 1591.148], margins: [87.527, 53.574] }
  ])('should draw $format.paging page on A4 sheet with margins $margins', ({ format, sheet, margins }) => {

    // when
    const result = [format.sheetWidth, format.sheetHeight, format.marginX, format.marginY];

    // then
    [...sheet, ...margins].forEach((value, i) => expect(result[i]).toBeCloseTo(value, 3));
  });

  it.each([
    { format: PageFormat.LANDSCAPE, ratio: 210 / 297 },
    { format: PageFormat.PORTRAIT, ratio: 297 / 210 }
  ])('should give $format.paging sheet the proportions of A4 paper', ({ format, ratio }) => {

    // when
    const result = format.sheetHeight / format.sheetWidth;

    // then
    expect(result).toBeCloseTo(ratio, 10);
  });

  it.each([PageFormat.LANDSCAPE, PageFormat.PORTRAIT])('should centre header, page and footer on $paging sheet', format => {

    // when
    const block = [2 * format.marginX + format.width, 2 * format.marginY + PageFormat.SHEET_HEADER + format.height + PageFormat.SHEET_FOOTER];

    // then
    expect(block[0]).toBeCloseTo(format.sheetWidth, 10);
    expect(block[1]).toBeCloseTo(format.sheetHeight, 10);
  });

  it('should draw unpaged canvas without sheet margins', () => {

    // when
    const result = [PageFormat.UNPAGED.sheetWidth, PageFormat.UNPAGED.sheetHeight, PageFormat.UNPAGED.marginX, PageFormat.UNPAGED.marginY];

    // then
    expect(result).toEqual([1400, 950, 0, 0]);
  });

  it.each([
    { format: PageFormat.LANDSCAPE, paperWidth: A4_LONG_PX, paperHeight: A4_SHORT_PX },
    { format: PageFormat.PORTRAIT, paperWidth: A4_SHORT_PX, paperHeight: A4_LONG_PX }
  ])('should print $format.paging sheet within A4 paper', ({ format, paperWidth, paperHeight }) => {

    // when
    const printedHeight = format.printWidthPx * format.sheetHeight / format.sheetWidth;

    // then
    expect(format.printWidthPx).toBeLessThan(paperWidth);
    expect(printedHeight).toBeLessThan(paperHeight);
  });

  it.each([
    { format: PageFormat.LANDSCAPE, y: 949, index: 0, top: 0 },
    { format: PageFormat.LANDSCAPE, y: 950, index: 1, top: 950 },
    { format: PageFormat.PORTRAIT, y: 1399, index: 0, top: 0 },
    { format: PageFormat.PORTRAIT, y: 2900, index: 2, top: 2800 },
    { format: PageFormat.UNPAGED, y: 5000, index: 0, top: 0 }
  ])('should place y $y on page $index of $format.paging format', ({ format, y, index, top }) => {

    // when
    const result = [format.pageIndexOf(y), format.pageTopOf(y)];

    // then
    expect(result).toEqual([index, top]);
  });
});
