import { MathRandomSource } from './random-source';

describe('MathRandomSource', () => {

  afterEach(() => vi.restoreAllMocks());

  it('#next should return value of Math.random', () => {

    // given
    vi.spyOn(Math, 'random').mockReturnValue(0.42);

    // when
    const value = new MathRandomSource().next();

    // then
    expect(value).toBe(0.42);
  });
});
