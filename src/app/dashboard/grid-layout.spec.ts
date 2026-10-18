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

  describe('resizing', () => {

    const contentWidth = 800;

    beforeEach(() => gridLayout.gridColumns = 4);

    it('#columnOf should return start column of tile offset', () => {

      // when
      const column = gridLayout.columnOf(400, contentWidth);

      // then
      expect(column).toBe(2);
    });

    it('#coveredSpansOf should keep cells while edge stays within them', () => {

      // when
      const spans = gridLayout.coveredSpansOf(390, 590, 0, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 2, rowSpan: 3 });
    });

    it('#coveredSpansOf should keep cells while edge is in gap', () => {

      // when
      const spans = gridLayout.coveredSpansOf(399, 399, 0, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 2, rowSpan: 2 });
    });

    it('#coveredSpansOf should grow as soon as edge enters next cell', () => {

      // when
      const spans = gridLayout.coveredSpansOf(401, 401, 0, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 3, rowSpan: 3 });
    });

    it('#coveredSpansOf should limit column span to columns right of start column', () => {

      // when
      const spans = gridLayout.coveredSpansOf(790, 190, 2, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 2, rowSpan: 1 });
    });

    it('#coveredSpansOf should limit row span to max row span', () => {

      // when
      const spans = gridLayout.coveredSpansOf(190, 2000, 0, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 1, rowSpan: 4 });
    });

    it('#coveredSpansOf should consider cell ratio', () => {

      // given
      gridLayout.gridCellRatio = '2:1';

      // when
      const spans = gridLayout.coveredSpansOf(190, 106, 0, contentWidth);

      // then
      expect(spans).toEqual({ columnSpan: 1, rowSpan: 2 });
    });

    it('#tileSizeOf should return size of covered cells', () => {

      // when
      const size = gridLayout.tileSizeOf({ columnSpan: 2, rowSpan: 3 }, contentWidth);

      // then
      expect(size).toEqual({ width: 390, height: 590 });
    });

    it('#tileSizeOf should consider cell ratio', () => {

      // given
      gridLayout.gridCellRatio = '2:1';

      // when
      const size = gridLayout.tileSizeOf({ columnSpan: 1, rowSpan: 2 }, contentWidth);

      // then
      expect(size).toEqual({ width: 190, height: 200 });
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

  it('#narrowsElements should return true when element spans more columns than grid columns', () => {

    // given
    contexts[0].gridColumnSpan = 3;

    // when
    const narrows = gridLayout.narrowsElements(2, contexts);

    // then
    expect(narrows).toBe(true);
  });

  it('#narrowsElements should return false when all elements fit into grid columns', () => {

    // given
    contexts[0].gridColumnSpan = 2;

    // when
    const narrows = gridLayout.narrowsElements(2, contexts);

    // then
    expect(narrows).toBe(false);
  });

  it('#setGridColumns should reduce column span of larger elements', () => {

    // given
    contexts[0].gridColumnSpan = 3;
    vi.mocked(contexts[0].fireSizeChanged).mockClear();

    // when
    gridLayout.setGridColumns(2, contexts);

    // then
    expect(gridLayout.gridColumns).toBe(2);
    expect(contexts[0].gridColumnSpan).toBe(2);
    contexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });

  it('#setGridCellRatio should resize all elements', () => {

    // when
    gridLayout.setGridCellRatio('4:5', contexts);

    // then
    expect(gridLayout.gridCellRatio).toBe('4:5');
    contexts.forEach(c => expect(c.fireSizeChanged).toHaveBeenCalledTimes(1));
  });
});
