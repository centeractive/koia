import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { FreeLayout, Rect } from './free-layout';
import { RowRoom } from './row-room';

describe('RowRoom', () => {

  const rowRoom = new RowRoom(new FreeLayout(PageFormat.LANDSCAPE));

  function rect(x: number, y: number, width = 300, height = 200): Rect {
    return { x, y, width, height };
  }

  function positionsOf(rects: Rect[]): number[][] {
    return rects.map(r => [r.x, r.y]);
  }

  it('should shift the tiles right of a tile grown right, wrapping the last', () => {

    // given
    const others = [rect(310, 10), rect(620, 10), rect(930, 10)];

    // when
    const arrangement = rowRoom.makeRoom(rect(0, 10, 500), rect(0, 10), others, 'resize');

    // then
    expect(arrangement.target).toEqual(rect(0, 10, 500));
    expect(positionsOf(arrangement.rects)).toEqual([[510, 10], [820, 10], [0, 220]]);
  });

  it('should shift the right neighbour of a tile moved right', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(50, 10), rect(0, 10), [rect(310, 10)], 'move');

    // then
    expect(positionsOf([arrangement.target])).toEqual([[50, 10]]);
    expect(positionsOf(arrangement.rects)).toEqual([[360, 10]]);
  });

  it('should shift a staggered right neighbour', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(0, 10, 400), rect(0, 10), [rect(310, 5)], 'resize');

    // then
    expect(positionsOf(arrangement.rects)).toEqual([[410, 5]]);
  });

  it('should stop the left edge of a tile grown left at its left neighbour', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(200, 10, 410), rect(310, 10), [rect(0, 10)], 'resize');

    // then
    expect(arrangement.target).toEqual(rect(310, 10));
    expect(positionsOf(arrangement.rects)).toEqual([[0, 10]]);
  });

  it('should stop a tile moved left at its left neighbour', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(300, 10), rect(310, 10), [rect(0, 10)], 'move');

    // then
    expect(arrangement.target).toEqual(rect(310, 10));
  });

  it('should not move a tile right that sits closer to its left neighbour than the gap', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(460, 10), rect(470, 10), [rect(0, 10, 466)], 'move');

    // then
    expect(arrangement.target).toEqual(rect(470, 10));
  });

  it('should stop the top edge of a tile grown up below the tile above', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(0, 50, 300, 260), rect(0, 110), [rect(0, 0, 300, 100)], 'resize');

    // then
    expect(arrangement.target).toEqual(rect(0, 110));
  });

  it('should stop a tile moved up below the tile above', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(0, 50), rect(0, 110), [rect(0, 0, 300, 100)], 'move');

    // then
    expect(arrangement.target).toEqual(rect(0, 110));
  });

  it('should stop the left edge first and the top edge then only at tiles above the edge stopped', () => {

    // given
    const [left, aboveLeft] = [rect(0, 0, 300, 100), rect(320, 0, 100, 100)];

    // when
    const beside = rowRoom.makeRoom(rect(250, 50, 360, 260), rect(310, 110), [left], 'resize');
    const below = rowRoom.makeRoom(rect(250, 50, 360, 260), rect(310, 110), [left, aboveLeft], 'resize');

    // then
    expect(beside.target).toEqual(rect(310, 50, 300, 260));
    expect(below.target).toEqual(rect(310, 110, 300, 200));
  });

  it('should stop the right edge of a tile grown right at a tall tile of the row above', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(0, 220, 500), rect(0, 220), [rect(450, 0, 300, 410)], 'resize');

    // then
    expect(arrangement.target).toEqual(rect(0, 220, 440));
    expect(positionsOf(arrangement.rects)).toEqual([[450, 0]]);
  });

  it('should stop a tile moved right at a tall tile of the row above', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(200, 220), rect(0, 220), [rect(450, 0, 300, 410)], 'move');

    // then
    expect(arrangement.target).toEqual(rect(140, 220));
  });

  it('should push the tile below a tile grown down', () => {

    // when
    const arrangement = rowRoom.makeRoom(rect(0, 10, 300, 300), rect(0, 10), [rect(0, 220)], 'resize');

    // then
    expect(positionsOf(arrangement.rects)).toEqual([[0, 320]]);
  });

  it('should keep a tile reaching past the page edge in its row when grown down', () => {

    // given
    const others = [rect(0, 0, 466), rect(476, 0, 456)];

    // when
    const arrangement = rowRoom.makeRoom(rect(942, 0, 459, 300), rect(942, 0, 459), others, 'resize');

    // then
    expect(arrangement.target).toEqual(rect(942, 0, 459, 300));
    expect(positionsOf(arrangement.rects)).toEqual([[0, 0], [476, 0]]);
  });
});
