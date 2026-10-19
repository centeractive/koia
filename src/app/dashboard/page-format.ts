import { CanvasPaging } from 'app/shared/model';

/**
 * size of the pages of the free canvas in page units
 */
export class PageFormat {

  static readonly LANDSCAPE = new PageFormat(CanvasPaging.LANDSCAPE, 1400, 950, true, 950);
  static readonly PORTRAIT = new PageFormat(CanvasPaging.PORTRAIT, 950, 1400, true, 600);
  static readonly UNPAGED = new PageFormat(CanvasPaging.NONE, 1400, 950, false, 970);

  /**
   * @param height page height, the maximum tile height when unpaged
   * @param printWidthPx printed width in CSS pixels; a printed sheet (header, page and footer) plus the canvas padding fits
   * the printable height with 10mm margins: landscape 1034 * 950 / 1400 + 5 = 707 <= 718 (A4), portrait
   * 1484 * 600 / 950 + 5 = 942 <= 980 (Letter); unpaged is the printable width of landscape Letter less the canvas padding
   */
  private constructor(readonly paging: CanvasPaging, readonly width: number, readonly height: number, readonly paged: boolean,
    readonly printWidthPx: number) { }

  static of(paging: CanvasPaging): PageFormat {
    if (paging === CanvasPaging.PORTRAIT) {
      return PageFormat.PORTRAIT;
    }
    return paging === CanvasPaging.NONE ? PageFormat.UNPAGED : PageFormat.LANDSCAPE;
  }

  pageIndexOf(y: number): number {
    return this.paged ? Math.floor(y / this.height) : 0;
  }

  pageTopOf(y: number): number {
    return this.pageIndexOf(y) * this.height;
  }
}
