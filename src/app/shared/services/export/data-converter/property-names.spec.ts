import { Column, DataType } from 'app/shared/model';
import { propertyNamesOf } from './property-names';

describe('propertyNamesOf', () => {

  const columns: Column[] = [
    { name: 'a', dataType: DataType.TEXT, width: 10 },
    { name: 'b', dataType: DataType.TEXT, width: 10 },
    { name: 'c', dataType: DataType.TEXT, width: 10 }
  ];

  it('should return column names when there is no data', () => {

    // when
    const names = propertyNamesOf([], columns);

    // then
    expect(names).toEqual(['a', 'b', 'c']);
  });

  it('should return keys of first row when all rows have same keys', () => {

    // given
    const data = [{ c: 1, a: 2 }, { a: 3, c: 4 }];

    // when
    const names = propertyNamesOf(data, columns);

    // then
    expect(names).toEqual(['c', 'a']);
  });

  it('should place key missing in first row at its column position', () => {

    // given
    const data = [{ _id: '1', a: 1, c: 2 }, { _id: '2', b: 3, c: 4 }];

    // when
    const names = propertyNamesOf(data, columns);

    // then
    expect(names).toEqual(['_id', 'a', 'b', 'c']);
  });

  it('should append key missing in first row that is no column', () => {

    // given
    const data = [{ a: 1, c: 2 }, { a: 3, x: 4 }];

    // when
    const names = propertyNamesOf(data, columns);

    // then
    expect(names).toEqual(['a', 'c', 'x']);
  });

  it('should append column key missing in first row when no later column precedes it', () => {

    // given
    const data = [{ a: 1 }, { c: 2 }];

    // when
    const names = propertyNamesOf(data, columns);

    // then
    expect(names).toEqual(['a', 'c']);
  });

  it('should keep keys of first row first when they are no columns', () => {

    // given
    const data = [{ _id: '1', c: 1 }, { _id: '2', a: 2 }];

    // when
    const names = propertyNamesOf(data, columns);

    // then
    expect(names).toEqual(['_id', 'a', 'c']);
  });
});
