import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { visibleCenterOf } from './visible-center';

describe('visibleCenterOf', () => {

  let scroller: HTMLDivElement;
  let layer: HTMLDivElement;

  beforeEach(() => {
    scroller = document.createElement('div');
    scroller.style.cssText = 'position: fixed; left: 10px; top: 20px; width: 400px; height: 300px; overflow: auto; box-sizing: border-box';
    layer = document.createElement('div');
    layer.style.cssText = 'width: 700px; height: 2000px';
    scroller.appendChild(layer);
    document.body.appendChild(scroller);
  });

  afterEach(() => scroller.remove());

  function scale(): number {
    return 700 / PageFormat.LANDSCAPE.width;
  }

  it('should return centre of client area in page units of layer', () => {

    // when
    const center = visibleCenterOf(scroller, layer, PageFormat.LANDSCAPE.width);

    // then
    expect(center.x).toBeCloseTo(scroller.clientWidth / 2 / scale(), 5);
    expect(center.y).toBeCloseTo(scroller.clientHeight / 2 / scale(), 5);
  });

  it('should exclude borders of scroller', () => {

    // given
    scroller.style.borderLeft = '30px solid';
    scroller.style.borderRight = '10px solid';
    scroller.style.borderTop = '20px solid';

    // when
    const center = visibleCenterOf(scroller, layer, PageFormat.LANDSCAPE.width);

    // then
    expect(center.x).toBeCloseTo(scroller.clientWidth / 2 / scale(), 5);
    expect(center.y).toBeCloseTo(scroller.clientHeight / 2 / scale(), 5);
    expect(scroller.clientWidth).toBeLessThanOrEqual(360);
  });

  it('should follow scroll position', () => {

    // given
    scroller.scrollTop = 500;
    scroller.scrollLeft = 100;

    // when
    const center = visibleCenterOf(scroller, layer, PageFormat.LANDSCAPE.width);

    // then
    expect(center.x).toBeCloseTo((100 + scroller.clientWidth / 2) / scale(), 5);
    expect(center.y).toBeCloseTo((500 + scroller.clientHeight / 2) / scale(), 5);
  });

  it('should return undefined while layer has no width', () => {

    // given
    layer.style.width = '0';

    // when
    const center = visibleCenterOf(scroller, layer, PageFormat.LANDSCAPE.width);

    // then
    expect(center).toBeUndefined();
  });
});
