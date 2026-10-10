import * as _ from 'lodash';

export class TableFitter {

  static contentWidth(scrollbarWidth: number, columnWidths: number[]): number {
    return scrollbarWidth + _.sum(columnWidths);
  }

  static hasHorizontalOverflow(contentWidth: number, availableWidth: number): boolean {
    return contentWidth > availableWidth;
  }

  static contentHeight(headerHeight: number, bodyHeight: number, horizontalScrollbarHeight: number): number {
    return headerHeight + bodyHeight + horizontalScrollbarHeight;
  }
}
