import { CanvasPaging } from 'app/shared/model/canvas-paging.enum';

/**
 * size of the pages of the free canvas in page units, each page drawn on a sheet of A4 paper with its margins
 */
export class PageFormat {

  static readonly SHEET_HEADER = 56;
  static readonly SHEET_FOOTER = 28;
  /** screen pixels around and between the sheets */
  static readonly DESK_GUTTER_PX = 32;
  private static readonly PRINT_MARGIN_MM = 10;

  static readonly LANDSCAPE = new PageFormat(CanvasPaging.LANDSCAPE, 1400, 950, 1120, { width: 297, height: 210 });
  static readonly PORTRAIT = new PageFormat(CanvasPaging.PORTRAIT, 950, 1400, 791, { width: 210, height: 297 });
  static readonly UNPAGED = new PageFormat(CanvasPaging.NONE, 1400, 950, 970);

  readonly paged: boolean;
  readonly sheetWidth: number;
  readonly sheetHeight: number;
  readonly marginX: number;
  readonly marginY: number;

  /**
   * @param height page height, the maximum tile height when unpaged
   * @param printWidthPx printed sheet width in CSS pixels; paged the A4 width (297mm = 1122.5px, 210mm = 793.7px) less
   * slack, so the zoomed sheet never exceeds the paper (1120 * 210 / 297 = 791.9 < 793.7, 791 * 297 / 210 = 1118.7 < 1122.5);
   * unpaged the printable width of landscape Letter less the canvas padding
   * @param paperMm paper size in millimetres, the sheet shows header, page and footer centred within the print margins
   */
  private constructor(readonly paging: CanvasPaging, readonly width: number, readonly height: number, readonly printWidthPx: number,
    paperMm?: { width: number; height: number }) {
    this.paged = paperMm !== undefined;
    if (this.paged) {
      const blockHeight = height + PageFormat.SHEET_HEADER + PageFormat.SHEET_FOOTER;
      const printMargins = 2 * PageFormat.PRINT_MARGIN_MM;
      const unitsPerMm = Math.max(width / (paperMm.width - printMargins), blockHeight / (paperMm.height - printMargins));
      this.sheetWidth = paperMm.width * unitsPerMm;
      this.sheetHeight = paperMm.height * unitsPerMm;
      this.marginX = (this.sheetWidth - width) / 2;
      this.marginY = (this.sheetHeight - blockHeight) / 2;
    } else {
      this.sheetWidth = width;
      this.sheetHeight = height;
      this.marginX = 0;
      this.marginY = 0;
    }
  }

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

  /**
   * @returns the top of the page a tile ending at the given bottom lies on, a bottom on a page boundary belongs to the page above
   */
  pageTopOfBottom(bottom: number): number {
    return this.paged ? Math.max(0, Math.ceil(bottom / this.height) - 1) * this.height : 0;
  }
}
