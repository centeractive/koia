import { Column, DataType } from 'app/shared/model';
import { TextMeasurer } from '../table-fit/text-measurer';
import { ColumnAutoSizer } from './column-auto-sizer';
import { ColumnWidthResolver } from './column-width-resolver';

describe('ColumnWidthResolver', () => {

  const resolver = new ColumnWidthResolver();
  const measurer = new TextMeasurer(ColumnWidthResolver.FONT);
  const measure = (text: string) => measurer.width(text);

  function column(name: string, dataType: DataType, width: number): Column {
    return { name, dataType, width };
  }

  it('#widthOf should convert em width to px', () => {

    // when
    const width = resolver.widthOf(column('Level', DataType.TEXT, 5), 'em', true, [], false);

    // then
    expect(width).toBe(5 * ColumnWidthResolver.EM_PX);
  });

  it('#widthOf should return px width unchanged', () => {

    // when
    const width = resolver.widthOf(column('Level', DataType.TEXT, 5), 'px', true, [], false);

    // then
    expect(width).toBe(5);
  });

  it('#widthOf should auto size when column widths ignored', () => {

    // given
    const entries = [{ Host: 'server-node-0' }, { Host: 'server-node-with-long-name' }];

    // when
    const width = resolver.widthOf(column('Host', DataType.TEXT, 5), 'em', false, entries, false);

    // then
    expect(width).toBe(ColumnAutoSizer.width(['server-node-with-long-name'], measure));
  });

  it('#widthOf should auto size when column has no width', () => {

    // given
    const entries = [{ Host: 'server-node-with-long-name' }];

    // when
    const width = resolver.widthOf(column('Host', DataType.TEXT, null), 'em', true, entries, false);

    // then
    expect(width).toBe(ColumnAutoSizer.width(['server-node-with-long-name'], measure));
  });

  it('#widthOf should use header width when cells are shorter', () => {

    // given
    const entries = [{ Description: 'a' }];

    // when
    const width = resolver.widthOf(column('Description', DataType.TEXT, 0), 'em', true, entries, false);

    // then
    expect(width).toBe(ColumnAutoSizer.width(['Description'], measure) + ColumnWidthResolver.SORT_WIDTH);
  });

  it('#widthOf should not exceed max width', () => {

    // given
    const name = 'H'.repeat(200);

    // when
    const width = resolver.widthOf(column(name, DataType.TEXT, 0), 'em', true, [], false);

    // then
    expect(width).toBe(ColumnAutoSizer.MAX);
  });

  it('#widthOf should measure nested object values when shown', () => {

    // given
    const entries = [{ N: '{ "attribute": "value" }' }];

    // when
    const hiddenWidth = resolver.widthOf(column('N', DataType.OBJECT, 0), 'em', true, entries, false);
    const shownWidth = resolver.widthOf(column('N', DataType.OBJECT, 0), 'em', true, entries, true);

    // then
    expect(hiddenWidth).toBe(ColumnAutoSizer.width(['N'], measure) + ColumnWidthResolver.SORT_WIDTH);
    expect(shownWidth).toBe(ColumnAutoSizer.width(['{ "attribute": "value" }'], measure));
  });

  it.each([[70, 5], [76, 5], [77, 6]])('#charsOf should round %ipx to %i chars', (px, chars) => {

    // when
    const result = resolver.charsOf(px);

    // then
    expect(result).toBe(chars);
  });
});
