import { PageFormat } from './page-format';

/**
 * styles the sheets of a page format in page units that scale with the width of their pages
 */
export class SheetLayout {

  constructor(public pageFormat = PageFormat.LANDSCAPE) { }

  /**
   * sizes the sheets, portrait ones at the scale of landscape ones
   */
  pagesStyle(): object {
    const { sheetWidth, paged, printWidthPx } = this.pageFormat;
    return {
      '--koia-pu': 'calc(100cqw / ' + sheetWidth + ')',
      width: paged ? 'calc(100% * ' + sheetWidth + ' / ' + PageFormat.LANDSCAPE.sheetWidth + ')' : '100%',
      '--koia-print-width': printWidthPx + 'px'
    };
  }

  pageStyle(page: number): object {
    if (!this.pageFormat.paged) {
      return {};
    }
    const style = { padding: this.pageUnits(this.pageFormat.marginY) + ' ' + this.pageUnits(this.pageFormat.marginX) };
    return page > 0 ? { ...style, 'margin-top': PageFormat.DESK_GUTTER_PX + 'px' } : style;
  }

  sheetHeaderStyle(): object {
    return { height: this.pageUnits(PageFormat.SHEET_HEADER) };
  }

  sheetFooterStyle(): object {
    return { height: this.pageUnits(PageFormat.SHEET_FOOTER) };
  }

  sheetContentStyle(): object {
    return { height: this.pageUnits(this.pageFormat.height) };
  }

  /**
   * lays out content in printed pixels below the top padding, scaled to the pages width on screen
   */
  windowStyle(pagesWidthPx: number): object {
    const { printContentWidth, printContentHeight, printTopPadding, printWidthPx } = this.pageFormat;
    return {
      width: printContentWidth + 'px',
      height: printContentHeight + 'px',
      'padding-top': printTopPadding + 'px',
      'box-sizing': 'border-box',
      transform: 'scale(' + pagesWidthPx / printWidthPx + ')'
    };
  }

  protected pageUnits(value: number): string {
    return 'calc(' + value + ' * var(--koia-pu))';
  }
}
