import { pageTopsOf } from './page-breaks';

describe('pageTopsOf', () => {

  it('should give one page without rows', () => {

    // when
    const result = pageTopsOf([], 100);

    // then
    expect(result).toEqual([0]);
  });

  it('should keep rows fitting one page on it', () => {

    // when
    const result = pageTopsOf([{ top: 0, bottom: 40 }, { top: 40, bottom: 80 }], 100);

    // then
    expect(result).toEqual([0]);
  });

  it('should start new page at top of row crossing page bottom', () => {

    // when
    const result = pageTopsOf([{ top: 0, bottom: 40 }, { top: 40, bottom: 80 }, { top: 80, bottom: 120 }, { top: 120, bottom: 160 }], 100);

    // then
    expect(result).toEqual([0, 80]);
  });

  it('should keep row ending at page bottom on page', () => {

    // when
    const result = pageTopsOf([{ top: 0, bottom: 50 }, { top: 50, bottom: 100 }, { top: 100, bottom: 150 }], 100);

    // then
    expect(result).toEqual([0, 100]);
  });

  it('should cut row taller than page', () => {

    // when
    const result = pageTopsOf([{ top: 0, bottom: 30 }, { top: 30, bottom: 280 }], 100);

    // then
    expect(result).toEqual([0, 30, 130, 230]);
  });
});
