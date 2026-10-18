import { waitFrames, waitStable } from './animation-frames';

describe('animation frames', () => {

  it('#waitFrames should resolve true as soon as condition holds', async () => {

    // given
    let checks = 0;

    // when
    const result = await waitFrames(() => ++checks === 3, 10);

    // then
    expect(result).toBe(true);
    expect(checks).toBe(3);
  });

  it('#waitFrames should resolve false when condition never holds', async () => {

    // when
    const result = await waitFrames(() => false, 2);

    // then
    expect(result).toBe(false);
  });

  it('#waitStable should resolve true when value stays unchanged', async () => {

    // when
    const result = await waitStable(() => 42, 3, 10);

    // then
    expect(result).toBe(true);
  });

  it('#waitStable should resolve false when value keeps changing', async () => {

    // given
    let value = 0;

    // when
    const result = await waitStable(() => value++, 3, 5);

    // then
    expect(result).toBe(false);
  });
});
