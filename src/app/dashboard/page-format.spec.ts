import { CanvasPaging } from 'app/shared/model';
import { PageFormat } from './page-format';

describe('PageFormat', () => {

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
    { format: PageFormat.LANDSCAPE, expected: [CanvasPaging.LANDSCAPE, 1400, 950, true, 950] },
    { format: PageFormat.PORTRAIT, expected: [CanvasPaging.PORTRAIT, 950, 1400, true, 600] },
    { format: PageFormat.UNPAGED, expected: [CanvasPaging.NONE, 1400, 950, false, 970] }
  ])('should define size and print width of $format.paging format', ({ format, expected }) => {

    // when
    const result = [format.paging, format.width, format.height, format.paged, format.printWidthPx];

    // then
    expect(result).toEqual(expected);
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
