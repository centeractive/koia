import { fontOf } from './summary-table-style';

describe('SummaryTableStyle', () => {

  it('#fontOf should combine weight, size and family', () => {

    // when
    const font = fontOf({ fontWeight: 500, fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: 0, horizontalPadding: 16 });

    // then
    expect(font).toBe('500 14px Roboto, sans-serif');
  });
});
