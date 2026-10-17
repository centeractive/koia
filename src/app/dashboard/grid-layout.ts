import { LanguageService } from 'app/shared/services/language/language.service';
import { ElementContext } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';
import { cellRatioToNumber } from './aspect-ratio';

/**
 * lays out elements in a grid where each element spans one or several cells
 */
export class GridLayout {

  /** must equal twice the grid padding and the flex element margin (5px) for tiles to keep their position across layouts */
  static readonly GAP_PX = 10;
  static readonly ROW_SPANS = [1, 2, 3, 4];
  static readonly COLUMN_CHOICES = [1, 2, 3, 4, 5];
  static readonly CELL_RATIO_CHOICES = ['1:1', '3:2', '2:1', '2:3', '1:2'];

  gridColumns = 3;
  gridCellRatio = '1:1';

  columnSpans(): number[] {
    return NumberUtils.rangeClosedIntArray(this.gridColumns);
  }

  gridStyle(): object {
    return {
      display: 'grid',
      'grid-template-columns': 'repeat(' + this.gridColumns + ', minmax(0, 1fr))',
      'grid-auto-rows': 'calc((100cqw - ' + (this.gridColumns - 1) * GridLayout.GAP_PX + 'px) / ' + this.gridColumns
        + ' / ' + cellRatioToNumber(this.gridCellRatio) + ')',
      'gap': GridLayout.GAP_PX + 'px'
    };
  }

  spansOf(width: number, height: number, contentWidth: number): { columnSpan: number, rowSpan: number } {
    const columnSpan = this.clamp(Math.round((width + GridLayout.GAP_PX) * this.gridColumns / contentWidth), this.gridColumns);
    const rowHeight = (contentWidth / this.gridColumns - GridLayout.GAP_PX) / cellRatioToNumber(this.gridCellRatio);
    const maxRowSpan = GridLayout.ROW_SPANS[GridLayout.ROW_SPANS.length - 1];
    const rowSpan = this.clamp(Math.round((height + GridLayout.GAP_PX) / (rowHeight + GridLayout.GAP_PX)), maxRowSpan);
    return { columnSpan, rowSpan };
  }

  private clamp(span: number, max: number): number {
    return Math.min(Math.max(span, 1), max);
  }

  cellStyle(context: ElementContext): object {
    return {
      'grid-column': 'auto / span ' + context.gridColumnSpan,
      'grid-row': 'auto / span ' + context.gridRowSpan
    };
  }

  setGridColumns(gridColumns: number, elementContexts: ElementContext[]): void {
    const largerElementContexts = elementContexts.filter(c => c.gridColumnSpan > gridColumns);
    if (largerElementContexts.length === 0 || confirm(LanguageService.instant('dashboard.confirmResize'))) {
      largerElementContexts.forEach(c => c.gridColumnSpan = gridColumns);
      this.gridColumns = gridColumns;
      elementContexts
        .filter(c => !largerElementContexts.includes(c))
        .forEach(c => c.fireSizeChanged());
    }
  }

  setGridCellRatio(gridCellRatio: string, elementContexts: ElementContext[]): void {
    this.gridCellRatio = gridCellRatio;
    elementContexts.forEach(c => c.fireSizeChanged());
  }
}
