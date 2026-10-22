import { PageFormat } from './page-format';
import { SheetLayout } from './sheet-layout';

describe('SheetLayout', () => {

  const layout = new SheetLayout();
  const portrait = new SheetLayout(PageFormat.PORTRAIT);
  const unpaged = new SheetLayout(PageFormat.UNPAGED);

  it('#pageStyle should give first sheet its paper margins', () => {

    // when
    const result = layout.pageStyle(0);

    // then
    expect(result).toEqual({ padding: 'calc(' + PageFormat.LANDSCAPE.marginY + ' * var(--koia-pu)) calc(' + PageFormat.LANDSCAPE.marginX + ' * var(--koia-pu))' });
  });

  it('#pageStyle should separate further sheets by desk gutter', () => {

    // when
    const result = layout.pageStyle(1);

    // then
    expect(result).toEqual({ ...layout.pageStyle(0), 'margin-top': '32px' });
  });

  it('#pageStyle should be empty without pages', () => {

    // when
    const result = unpaged.pageStyle(1);

    // then
    expect(result).toEqual({});
  });

  const landscapeSheet = PageFormat.LANDSCAPE.sheetWidth;
  const portraitSheet = PageFormat.PORTRAIT.sheetWidth;

  it.each([
    { layout, width: 'calc(100% * ' + landscapeSheet + ' / ' + landscapeSheet + ')', printWidth: '1120px', pu: 'calc(100cqw / ' + landscapeSheet + ')' },
    { layout: portrait, width: 'calc(100% * ' + portraitSheet + ' / ' + landscapeSheet + ')', printWidth: '791px', pu: 'calc(100cqw / ' + portraitSheet + ')' },
    { layout: unpaged, width: '100%', printWidth: '970px', pu: 'calc(100cqw / 1400)' }
  ])('#pagesStyle should size sheets to $width of canvas and print them $printWidth wide', ({ layout, width, printWidth, pu }) => {

    // when
    const result = layout.pagesStyle();

    // then
    expect(result).toEqual({ '--koia-pu': pu, width, '--koia-print-width': printWidth });
  });

  it('#sheetHeaderStyle should give header height in page units', () => {

    // when
    const result = layout.sheetHeaderStyle();

    // then
    expect(result).toEqual({ height: 'calc(56 * var(--koia-pu))' });
  });

  it('#sheetFooterStyle should give footer height in page units', () => {

    // when
    const result = layout.sheetFooterStyle();

    // then
    expect(result).toEqual({ height: 'calc(28 * var(--koia-pu))' });
  });

  it.each([
    { layout, height: 'calc(950 * var(--koia-pu))' },
    { layout: portrait, height: 'calc(1400 * var(--koia-pu))' }
  ])('#sheetContentStyle should give page height $height', ({ layout, height }) => {

    // when
    const result = layout.sheetContentStyle();

    // then
    expect(result).toEqual({ height });
  });

  it('#windowStyle should lay out printed content below top padding scaled to pages width', () => {

    // when
    const result = layout.windowStyle(2240);

    // then
    expect(result).toEqual({
      width: PageFormat.LANDSCAPE.printContentWidth + 'px',
      height: PageFormat.LANDSCAPE.printContentHeight + 'px',
      'padding-top': PageFormat.LANDSCAPE.printTopPadding + 'px',
      'box-sizing': 'border-box',
      transform: 'scale(2)'
    });
  });

  it('#windowStyle should lay out printed portrait content below top padding scaled to pages width', () => {

    // when
    const result = portrait.windowStyle(791 / 2);

    // then
    expect(result).toEqual({
      width: PageFormat.PORTRAIT.printContentWidth + 'px',
      height: PageFormat.PORTRAIT.printContentHeight + 'px',
      'padding-top': PageFormat.PORTRAIT.printTopPadding + 'px',
      'box-sizing': 'border-box',
      transform: 'scale(0.5)'
    });
  });
});
