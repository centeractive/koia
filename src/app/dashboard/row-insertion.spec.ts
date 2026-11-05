import * as _ from 'lodash';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { FreeLayout, Rect } from './free-layout';
import { RowInsertion } from './row-insertion';

describe('RowInsertion', () => {

  const landscape = new RowInsertion(new FreeLayout(PageFormat.LANDSCAPE));
  const unpaged = new RowInsertion(new FreeLayout(PageFormat.UNPAGED));

  function rect(x: number, y: number, width = 260, height = 200): Rect {
    return { x, y, width, height };
  }

  function positionsOf(rects: Rect[]): number[][] {
    return rects.map(r => [r.x, r.y]);
  }

  /** five squares in a row from the top, filling the page width but 60 units */
  function fiveSquares(y = 10, height = 200): Rect[] {
    return [0, 270, 540, 810, 1080].map(x => rect(x, y, 260, height));
  }

  it('should keep the order of a row until covering half of the right neighbour', () => {

    // given
    const others = [rect(0, 10, 300), rect(620, 10, 300)];

    // when
    const arrangement = landscape.arrange(rect(460, 10, 300), rect(310, 10, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[310, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [620, 10]]);
  });

  it('should swap with the right neighbour once covering half of it', () => {

    // given
    const others = [rect(0, 10, 300), rect(620, 10, 300)];

    // when
    const arrangement = landscape.arrange(rect(480, 10, 300), rect(310, 10, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[620, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [310, 10]]);
  });

  it('should keep the order of a row until covering half of the left neighbour', () => {

    // given
    const others = [rect(0, 10, 300), rect(620, 10, 300)];

    // when
    const arrangement = landscape.arrange(rect(160, 10, 300), rect(310, 10, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[310, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [620, 10]]);
  });

  it('should swap with the left neighbour once covering half of it', () => {

    // given
    const others = [rect(0, 10, 300), rect(620, 10, 300)];

    // when
    const arrangement = landscape.arrange(rect(140, 10, 300), rect(310, 10, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[310, 10], [620, 10]]);
  });

  it('should insert the last of five squares first and shift the others right', () => {

    // given
    const [a, b, c, d, e] = fiveSquares();

    // when
    const arrangement = landscape.arrange(rect(0, 10), e, [a, b, c, d]);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[270, 10], [540, 10], [810, 10], [1080, 10]]);
  });

  it('should insert between two tiles', () => {

    // given
    const others = [rect(0, 10), rect(270, 10), rect(540, 10)];

    // when
    const arrangement = landscape.arrange(rect(200, 10), rect(0, 500), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[270, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [540, 10], [810, 10]]);
  });

  it('should wrap the last tile of a full row to a new row below', () => {

    // given
    const row = fiveSquares();

    // when
    const arrangement = landscape.arrange(rect(0, 10), rect(0, 220), row);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[270, 10], [540, 10], [810, 10], [1080, 10], [0, 220]]);
  });

  it('should wrap the moved tile itself to a new row when inserted last into a full row', () => {

    // given
    const row = fiveSquares();

    // when
    const arrangement = landscape.arrange(rect(1150, 10), rect(0, 500), row);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 220]]);
    expect(positionsOf(arrangement.rects)).toEqual(positionsOf(fiveSquares()));
  });

  it('should wrap below the tiles on a free canvas', () => {

    // given
    const row = fiveSquares();

    // when
    const arrangement = unpaged.arrange(rect(1150, 10), rect(0, 1500), row);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 220]]);
  });

  it('should wrap into the next row, which wraps on into a new row', () => {

    // given
    const others = [...fiveSquares(10), ...fiveSquares(220)];

    // when
    const arrangement = landscape.arrange(rect(0, 10), rect(0, 600), others);

    // then
    expect(positionsOf(arrangement.rects)).toEqual([
      [270, 10], [540, 10], [810, 10], [1080, 10], [0, 220],
      [270, 220], [540, 220], [810, 220], [1080, 220], [0, 430]
    ]);
  });

  it('should pack wrapped tiles wider than the page into new rows', () => {

    // given
    const others = [rect(0, 10, 300), rect(310, 10, 500), rect(820, 10, 500)];

    // when
    const arrangement = landscape.arrange(rect(100, 10, 1300), rect(0, 500, 1300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 220]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [310, 10], [0, 430]]);
  });

  it('should skip a row whose page does not fit the wrapped tile and wrap onto the next page', () => {

    // given
    const others = [...fiveSquares(10), rect(0, 800, 260, 100)];

    // when
    const arrangement = landscape.arrange(rect(0, 10), rect(400, 600, 260, 100), others);

    // then
    expect(positionsOf(arrangement.rects.slice(4))).toEqual([[0, 960], [0, 800]]);
  });

  it('should keep the moved tile within the page width as first of its row', () => {

    // given
    const others = [rect(1200, 10, 200)];

    // when
    const arrangement = landscape.arrange(rect(1150, 10, 300), rect(0, 500, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[1100, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 220]]);
  });

  it('should push the tiles below down that a taller wrapped tile covers', () => {

    // given
    const others = [...fiveSquares(10).slice(0, 4), rect(1080, 10, 260, 400), rect(0, 220), rect(0, 430)];

    // when
    const arrangement = landscape.arrange(rect(0, 10), rect(400, 700), others);

    // then
    expect(positionsOf(arrangement.rects.slice(4))).toEqual([[0, 220], [270, 220], [0, 630]]);
  });

  it('should close the gap in the former row', () => {

    // given
    const others = [rect(0, 10, 300), rect(620, 10, 300), rect(0, 220, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 220, 300), rect(310, 10, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 220]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [310, 10], [310, 220]]);
  });

  it('should close the gap of the first tile of the former row', () => {

    // given
    const others = [rect(310, 10, 300), rect(0, 220, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 220, 300), rect(0, 10, 300), others);

    // then
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [310, 220]]);
  });

  it('should keep free space of the former row beyond the closed gap', () => {

    // given
    const others = [rect(0, 10, 300), rect(1000, 10, 300), rect(0, 220, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 220, 300), rect(310, 10, 300), others);

    // then
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [690, 10], [310, 220]]);
  });

  it('should keep the width of the moved tile for the tiles behind it', () => {

    // given
    const others = [rect(0, 10, 300), rect(310, 10, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 10, 600), rect(900, 500, 600), others);

    // then
    expect(arrangement.target).toEqual({ x: 310, y: 10, width: 600, height: 200 });
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [920, 10]]);
  });

  it('should pick the row of the tile covered most, the topmost of equal ones', () => {

    // given
    const others = [rect(0, 10), rect(0, 220)];

    // when
    const most = landscape.arrange(rect(0, 150), rect(500, 600), others);
    const equal = landscape.arrange(rect(0, 115), rect(500, 600), others);

    // then
    expect(most.target.y).toBe(220);
    expect(equal.target.y).toBe(10);
  });

  it('should pick the leftmost of equally covered tiles of a row', () => {

    // given
    const others = [rect(300, 10), rect(0, 10)];

    // when
    const arrangement = landscape.arrange(rect(150, 10), rect(500, 600), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[300, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[570, 10], [0, 10]]);
  });

  it('should not insert a tile covering no other tile', () => {

    // when
    const arrangement = landscape.arrange(rect(600, 500), rect(0, 10), [rect(0, 10)]);

    // then
    expect(arrangement).toBeUndefined();
  });

  it('should not insert a tile not fitting the page of the row', () => {

    // when
    const arrangement = landscape.arrange(rect(0, 800, 260, 200), rect(400, 10), [rect(0, 800, 260, 100)]);

    // then
    expect(arrangement).toBeUndefined();
  });

  it('should keep a tile reaching past the page edge in its row when a tile before it moves left', () => {

    // given
    const others = [rect(0, 0, 466), rect(942, 0, 459)];

    // when
    const arrangement = landscape.arrange(rect(400, 0, 456), rect(476, 0, 456), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[476, 0]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 0], [942, 0]]);
  });

  it('should keep the gaps narrower than the gap of the canvas when a tile before them moves left', () => {

    // given
    const others = [rect(0, 0, 466), rect(941, 0, 459)];

    // when
    const arrangement = landscape.arrange(rect(400, 0, 457), rect(475, 0, 457), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[475, 0]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 0], [941, 0]]);
  });

  it('should let the tile behind take the place and the gap of the moved tile, the next keeping its gap', () => {

    // given
    const others = [rect(0, 0, 343), rect(705, 0, 343), rect(1053, 0, 300), rect(0, 500)];

    // when
    const arrangement = landscape.arrange(rect(0, 500), rect(352, 0, 343), others);

    // then
    expect(positionsOf(arrangement.rects.slice(0, 3))).toEqual([[0, 0], [352, 0], [700, 0]]);
  });

  it('should keep the gaps of a row when a tile moves left by half its width', () => {

    // given
    const others = [rect(0, 0, 343), rect(705, 0, 695)];

    // when
    const arrangement = landscape.arrange(rect(181, 0, 343), rect(352, 0, 343), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[352, 0]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 0], [705, 0]]);
  });

  it('should keep abutting tiles abutting when a tile before them moves left', () => {

    // given
    const others = [rect(0, 0, 400), rect(800, 0, 600)];

    // when
    const arrangement = landscape.arrange(rect(350, 0, 400), rect(400, 0, 400), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[400, 0]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 0], [800, 0]]);
  });

  it('should keep the moved tile reaching past the page edge in its own row', () => {

    // given
    const others = [rect(0, 0, 466), rect(476, 0, 456)];

    // when
    const arrangement = landscape.arrange(rect(900, 0, 459), rect(942, 0, 459), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[942, 0]]);
  });

  it('should move a tile after the last of a row ending at the page edge as its right edge passes the centre of the last', () => {

    // given
    const others = [rect(0, 10, 460), rect(940, 10, 460)];

    // when
    const arrangement = landscape.arrange(rect(940, 10, 460), rect(470, 10, 460), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[940, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [470, 10]]);
  });

  it('should keep the row of the snapped tile while the pointer goes beyond the page edge', () => {

    // given
    const others = [rect(0, 10, 460), rect(940, 10, 460)];

    // when
    const arrangement = landscape.arrange(rect(940, 10, 460), rect(470, 10, 460), others, 1500);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[940, 10]]);
  });

  it('should wrap a tile from another row dropped after the last tile of a full row', () => {

    // given
    const others = [rect(0, 10, 460), rect(470, 10, 460), rect(940, 10, 460)];

    // when
    const arrangement = landscape.arrange(rect(940, 10, 460), rect(0, 500, 460), others, 1100);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 220]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [470, 10], [940, 10]]);
  });

  it('should wrap beside a tall tile of the row above reaching into the next row', () => {

    // given
    const others = [rect(0, 10, 400, 410), rect(410, 10, 490), rect(910, 10, 490), rect(410, 220, 300)];

    // when
    const arrangement = landscape.arrange(rect(410, 10, 300), rect(500, 700, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[410, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10], [720, 10], [410, 220], [910, 220]]);
  });

  it('should shift the tiles of a staggered row together', () => {

    // given
    const others = [rect(0, 10, 300), rect(310, 50, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 10, 300), rect(0, 600, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[310, 10], [620, 50]]);
  });

  it('should not wrap into the rest of its own staggered row', () => {

    // given
    const others = [rect(0, 50, 600), rect(700, 10, 600)];

    // when
    const arrangement = landscape.arrange(rect(0, 50, 300), rect(0, 600, 300), others);

    // then
    expect(positionsOf([arrangement.target])).toEqual([[0, 50]]);
    expect(positionsOf(arrangement.rects)).toEqual([[310, 50], [0, 260]]);
  });

  it('should close the gap of the former row no further than beside a tall tile of the row above', () => {

    // given
    const others = [rect(600, 10, 300, 410), rect(900, 220, 300), rect(0, 700, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 700, 100), rect(410, 220, 100), others);

    // then
    expect(positionsOf(arrangement.rects)).toEqual([[600, 10], [900, 220], [110, 700]]);
  });

  it('should keep a tile of the former row already covering a tall tile of the row above at its x', () => {

    // given
    const others = [rect(600, 10, 300, 410), rect(850, 220, 300), rect(0, 700, 300)];

    // when
    const arrangement = landscape.arrange(rect(0, 700, 100), rect(410, 220, 100), others);

    // then
    expect(arrangement.rects[1].x).toBe(850);
  });

  describe('row taken from the grid', () => {

    const GRID_ROW = [0, 352, 705, 1057];

    function gridRow(): Rect[] {
      return GRID_ROW.map(x => rect(x, 10, 343));
    }

    function arrangeMoved(insertion: RowInsertion, from: number, x: number): { all: Rect[], target: Rect } {
      const rects = gridRow();
      const arrangement = insertion.arrange({ ...rects[from], x }, rects[from], rects.filter((_r, i) => i !== from));
      return arrangement && { all: [...arrangement.rects, arrangement.target], target: arrangement.target };
    }

    it.each([
      { format: 'landscape', insertion: landscape },
      { format: 'monitor', insertion: unpaged }
    ])('should keep every tile in the row wherever one of them is moved within it on $format', ({ insertion }) => {

      // given
      const moves = [0, 1, 2, 3].flatMap(from => _.range(-1100, 1101, 25).map(dx => ({ from, x: _.clamp(GRID_ROW[from] + dx, 0, 1057) })));

      // when
      const arrangements = moves.map(m => arrangeMoved(insertion, m.from, m.x)).filter(a => a);

      // then
      expect(arrangements.length).toBe(264);
      arrangements.forEach(a => {
        expect(a.all.map(r => r.y)).toEqual([10, 10, 10, 10]);
        expect(Math.max(...a.all.map(r => r.x + r.width))).toBeLessThanOrEqual(1400);
      });
    });

    it('should hand the freed gap to the tile the moved one is inserted before, keeping the width of the row', () => {

      // when
      const { all, target } = arrangeMoved(landscape, 1, 0);

      // then
      expect(target.x).toBe(0);
      expect(all.map(r => r.x).sort((a, b) => a - b)).toEqual([0, 353, 705, 1057]);
    });

    it('should end the row where it ended when the third tile is moved behind the last', () => {

      // when
      const { target } = arrangeMoved(landscape, 2, 1057);

      // then
      expect(target.x).toBe(1057);
    });
  });
});
