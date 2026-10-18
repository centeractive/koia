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
});
