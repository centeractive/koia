import { ElementContext, SummaryContext } from 'app/shared/model';
import { cellRatioToNumber } from './aspect-ratio';
import { GridLayout } from './grid-layout';

describe('GridLayout', () => {

  let gridLayout: GridLayout;
  let contexts: ElementContext[];

  beforeEach(() => {
    gridLayout = new GridLayout();
    contexts = [new SummaryContext([]), new SummaryContext([]), new SummaryContext([])];
    contexts.forEach(c => vi.spyOn(c, 'fireSizeChanged').mockReturnValue(undefined));
  });

  it('should have 3 columns and quadratic cells by default', () => {
    expect(gridLayout.gridColumns).toBe(3);
    expect(gridLayout.gridCellRatio).toBe('1:1');
  });

  it('#columnSpans should return all possible column spans', () => {

    // given
    gridLayout.gridColumns = 4;

    // when
    const spans = gridLayout.columnSpans();

    // then
    expect(spans).toEqual([1, 2, 3, 4]);
  });

  it('#gridStyle should define grid columns and rows of cell ratio', () => {

    // given
    gridLayout.gridColumns = 4;
    gridLayout.gridCellRatio = '3:2';

    // when
    const style = gridLayout.gridStyle();

    // then
    expect(style).toEqual({
      display: 'grid',
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
      'grid-auto-rows': 'calc((100cqw - 30px) / 4 / 1.5)',
      gap: '10px'
    });
  });

  describe('#spansOf', () => {

    const contentWidth = 1210;

    beforeEach(() => gridLayout.gridColumns = 4);

    function tileWidth(columnSpan: number): number {
      return columnSpan * contentWidth / 4 - GridLayout.GAP_PX;
    }

    function tileHeight(rowSpan: number): number {
      const rowHeight = tileWidth(1) / cellRatioToNumber(gridLayout.gridCellRatio);
      return rowSpan * rowHeight + (rowSpan - 1) * GridLayout.GAP_PX;
    }

    it('should return spans of half-width tile with quadratic cells', () => {

      // when
      const spans = gridLayout.spansOf(tileWidth(2), tileHeight(1), contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 2, rowSpan: 1 });
    });

    it('should return all columns for full-width tile', () => {

      // when
      const spans = gridLayout.spansOf(tileWidth(4), tileHeight(1), contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 4, rowSpan: 1 });
    });

    it('should return minimal spans for tiny tile', () => {

      // when
      const spans = gridLayout.spansOf(10, 10, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 1, rowSpan: 1 });
    });

    it('should clamp spans of oversized tile', () => {

      // when
      const spans = gridLayout.spansOf(5000, 10000, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 4, rowSpan: 4 });
    });

    it('should consider cell ratio for row span', () => {

      // given
      gridLayout.gridCellRatio = '2:1';

      // when
      const spans = gridLayout.spansOf(tileWidth(1), tileWidth(1) + GridLayout.GAP_PX, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 1, rowSpan: 2 });
    });

    it('should return spans that produced the tile size', () => {

      // given
      gridLayout.gridCellRatio = '3:2';

      // when
      const spans = gridLayout.spansOf(tileWidth(3), tileHeight(2), contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 3, rowSpan: 2 });
    });
  });

  it('#cellStyle should span cells of element', () => {

    // given
    const context = new SummaryContext([]);
    context.gridColumnSpan = 2;
    context.gridRowSpan = 1;

    // when
    const style = gridLayout.cellStyle(context);

    // then
    expect(style).toEqual({ 'grid-column': 'auto / span 2', 'grid-row': 'auto / span 1' });
  });

  it('#setGridColumns should fire resize event for each element', () => {

    // when
    gridLayout.setGridColumns(2, contexts);

    // then
    expect(gridLayout.gridColumns).toBe(2);
    contexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });

  it('#setGridColumns should reduce column span of larger elements when user confirms', () => {

    // given
    contexts[0].gridColumnSpan = 3;
    vi.mocked(contexts[0].fireSizeChanged).mockClear();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // when
    gridLayout.setGridColumns(2, contexts);

    // then
    expect(gridLayout.gridColumns).toBe(2);
    expect(contexts[0].gridColumnSpan).toBe(2);
    contexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });

  it('#setGridColumns should be ignored when user declines resizing larger elements', () => {

    // given
    contexts[0].gridColumnSpan = 3;
    vi.mocked(contexts[0].fireSizeChanged).mockClear();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    // when
    gridLayout.setGridColumns(2, contexts);

    // then
    expect(gridLayout.gridColumns).toBe(3);
    expect(contexts[0].gridColumnSpan).toBe(3);
    contexts.forEach(c => expect(c.fireSizeChanged).not.toHaveBeenCalled());
  });

  it('#setGridCellRatio should resize all elements', () => {

    // when
    gridLayout.setGridCellRatio('4:5', contexts);

    // then
    expect(gridLayout.gridCellRatio).toBe('4:5');
    contexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });
});
