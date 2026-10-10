import { DomMetrics } from './dom-metrics';

describe('DomMetrics', () => {

  it('#scrollbarWidth should return width of native scrollbar and leave no element behind', () => {

    // given
    const childCount = document.body.childElementCount;
    const probe = document.createElement('div');
    probe.style.cssText = 'width: 100px; height: 100px; overflow: scroll;';
    document.body.appendChild(probe);
    const expected = probe.offsetHeight - probe.clientHeight;
    probe.remove();

    // when
    const width = DomMetrics.scrollbarWidth();

    // then
    expect(width).toBe(expected);
    expect(width).toBeGreaterThanOrEqual(0);
    expect(document.body.childElementCount).toBe(childCount);
  });



  it('#waitFrames should resolve true as soon as condition holds', async () => {

    // given
    let checks = 0;

    // when
    const result = await DomMetrics.waitFrames(() => ++checks === 3, 10);

    // then
    expect(result).toBe(true);
    expect(checks).toBe(3);
  });

  it('#waitFrames should resolve false when condition never holds', async () => {

    // when
    const result = await DomMetrics.waitFrames(() => false, 2);

    // then
    expect(result).toBe(false);
  });

  it('#waitStable should resolve true when value stays unchanged', async () => {

    // when
    const result = await DomMetrics.waitStable(() => 42, 3, 10);

    // then
    expect(result).toBe(true);
  });

  it('#waitStable should resolve false when value keeps changing', async () => {

    // given
    let value = 0;

    // when
    const result = await DomMetrics.waitStable(() => value++, 3, 5);

    // then
    expect(result).toBe(false);
  });
});
