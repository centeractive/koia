import { LanguageService } from 'app/shared/services/language/language.service';
import { ElementContext } from 'app/shared/model';
import { NumberUtils } from 'app/shared/utils';
import { cellRatioToNumber } from './aspect-ratio';

export interface GridSpans {
  columnSpan: number;
  rowSpan: number;
}

/**
 * lays out elements in a grid where each element spans one or several cells
 */
export class GridLayout {

  /** must equal twice the grid padding and the flex element margin (5px) for tiles to keep their position across layouts */
  static readonly GAP_PX = 10;
  static readonly ROW_SPANS = [1, 2, 3, 4];
  private static readonly MAX_ROW_SPAN = GridLayout.ROW_SPANS[GridLayout.ROW_SPANS.length - 1];

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

  spansOf(width: number, height: number, contentWidth: number): GridSpans {
    const columnSpan = this.clamp(Math.round((width + GridLayout.GAP_PX) / this.columnPitchOf(contentWidth)), this.gridColumns);
    const rowSpan = this.clamp(Math.round((height + GridLayout.GAP_PX) / this.rowPitchOf(contentWidth)), GridLayout.MAX_ROW_SPAN);
    return { columnSpan, rowSpan };
  }

  columnOf(left: number, contentWidth: number): number {
    return Math.round(left / this.columnPitchOf(contentWidth));
  }

  coveredSpansOf(width: number, height: number, column: number, contentWidth: number): GridSpans {
    const columnSpan = this.clamp(Math.ceil(width / this.columnPitchOf(contentWidth)), this.gridColumns - column);
    const rowSpan = this.clamp(Math.ceil(height / this.rowPitchOf(contentWidth)), GridLayout.MAX_ROW_SPAN);
    return { columnSpan, rowSpan };
  }

  tileSizeOf(spans: GridSpans, contentWidth: number): { width: number, height: number } {
    return {
      width: spans.columnSpan * this.columnPitchOf(contentWidth) - GridLayout.GAP_PX,
      height: spans.rowSpan * this.rowPitchOf(contentWidth) - GridLayout.GAP_PX
    };
  }

  private columnPitchOf(contentWidth: number): number {
    return contentWidth / this.gridColumns;
  }

  private rowPitchOf(contentWidth: number): number {
    return (this.columnPitchOf(contentWidth) - GridLayout.GAP_PX) / cellRatioToNumber(this.gridCellRatio) + GridLayout.GAP_PX;
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
