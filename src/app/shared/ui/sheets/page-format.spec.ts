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

  it.each([
    { format: PageFormat.LANDSCAPE, expected: 6.929 },
    { format: PageFormat.PORTRAIT, expected: 7.031 },
    { format: PageFormat.UNPAGED, expected: 6.929 }
  ])('should keep $expected printed pixels free below header of $format.paging sheet', ({ format, expected }) => {

    // when
    const result = format.printTopPadding;

    // then
    expect(result).toBeCloseTo(expected, 3);
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

  it('#pageTopOfBottom should return top of page containing bottom', () => {

    // when
    const top = PageFormat.LANDSCAPE.pageTopOfBottom(1200);

    // then
    expect(top).toBe(950);
  });

  it('#pageTopOfBottom should assign bottom on page boundary to page above', () => {

    // when
    const top = PageFormat.LANDSCAPE.pageTopOfBottom(1900);

    // then
    expect(top).toBe(950);
  });

  it('#pageTopOfBottom should return 0 when unpaged', () => {

    // when
    const top = PageFormat.UNPAGED.pageTopOfBottom(5000);

    // then
    expect(top).toBe(0);
  });

  it('#pageTopOfBottom should return 0 for bottom at 0', () => {

    // when
    const top = PageFormat.LANDSCAPE.pageTopOfBottom(0);

    // then
    expect(top).toBe(0);
  });

  it.each([
    { format: PageFormat.LANDSCAPE, width: 1400 * 1120 / PageFormat.LANDSCAPE.sheetWidth, height: 950 * 1120 / PageFormat.LANDSCAPE.sheetWidth },
    { format: PageFormat.PORTRAIT, width: 950 * 791 / PageFormat.PORTRAIT.sheetWidth, height: 1400 * 791 / PageFormat.PORTRAIT.sheetWidth }
  ])('should define printed content size of $format.paging format', ({ format, width, height }) => {

    // when
    const result = [format.printContentWidth, format.printContentHeight];

    // then
    expect(result).toEqual([width, height]);
  });

  it.each([
    { paging: CanvasPaging.LANDSCAPE, paged: true },
    { paging: CanvasPaging.PORTRAIT, paged: true },
    { paging: CanvasPaging.NONE, paged: false },
    { paging: undefined, paged: false }
  ])('#isPaged should be $paged for paging $paging', ({ paging, paged }) => {

    // when
    const result = PageFormat.isPaged(paging);

    // then
    expect(result).toBe(paged);
  });
});
