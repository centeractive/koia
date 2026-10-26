import { DataType, Operator, PropertyFilter, Query } from 'app/shared/model';
import { pinnedColumnsOf } from './pinned-columns';

describe('pinnedColumnsOf', () => {

   it('should return no column when queries have same filters', () => {

      // given
      const selection = queryOf(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));
      selection.addValueRangeFilter('Amount', 1, 5);
      const base = selection.clone();

      // when
      const pinned = pinnedColumnsOf(selection, base);

      // then
      expect([...pinned]).toEqual([]);
   });

   it.each([
      ['equal', new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT)],
      ['any of', new PropertyFilter('Level', Operator.ANY_OF, 'ERROR;WARN', DataType.TEXT)],
      ['none of', new PropertyFilter('Level', Operator.NONE_OF, 'INFO', DataType.TEXT)],
      ['empty', new PropertyFilter('Level', Operator.EMPTY, '', DataType.TEXT)]
   ])('should pin column of %s filter missing in base', (_, filter) => {

      // when
      const pinned = pinnedColumnsOf(queryOf(filter), new Query());

      // then
      expect([...pinned]).toEqual(['Level']);
   });

   it('should pin column of filter missing in selection', () => {

      // when
      const pinned = pinnedColumnsOf(new Query(), queryOf(new PropertyFilter('Host', Operator.EQUAL, 'server1')));

      // then
      expect([...pinned]).toEqual(['Host']);
   });

   it('should pin column with additional filter in selection', () => {

      // given
      const base = queryOf(new PropertyFilter('Level', Operator.NOT_EMPTY, ''));
      const selection = base.clone();
      selection.addPropertyFilter(new PropertyFilter('Level', Operator.EQUAL, 'ERROR'));

      // when
      const pinned = pinnedColumnsOf(selection, base);

      // then
      expect([...pinned]).toEqual(['Level']);
   });

   it('should not pin column of filter with same condition but other data type', () => {

      // given
      const selection = queryOf(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));
      const base = queryOf(new PropertyFilter('Level', Operator.EQUAL, 'ERROR'));

      // when
      const pinned = pinnedColumnsOf(selection, base);

      // then
      expect([...pinned]).toEqual([]);
   });

   it('should pin column of time unit range', () => {

      // given
      const selection = new Query();
      selection.addValueRangeFilter('Time', 1000, 2000, true);

      // when
      const pinned = pinnedColumnsOf(selection, new Query());

      // then
      expect([...pinned]).toEqual(['Time']);
   });

   it('should pin column of differing range', () => {

      // given
      const selection = new Query();
      selection.addValueRangeFilter('Amount', 1, 5, false, true);
      const base = new Query();
      base.addValueRangeFilter('Amount', 1, 5, false, false);

      // when
      const pinned = pinnedColumnsOf(selection, base);

      // then
      expect([...pinned]).toEqual(['Amount']);
   });

   it('should not pin column of ranges merged into same range by intersection', () => {

      // given
      const selection = new Query();
      selection.addValueRangeFilter('Amount', 1, 3);
      selection.addValueRangeFilter('Amount', 2, 5);
      const base = new Query();
      base.addValueRangeFilter('Amount', 2, 3);

      // when
      const pinned = pinnedColumnsOf(selection, base);

      // then
      expect([...pinned]).toEqual([]);
   });

   it('should ignore filters that are not applicable and full text filter', () => {

      // given
      const selection = queryOf(new PropertyFilter('Level', Operator.EQUAL, ''));
      selection.addValueRangeFilter('Amount', undefined, undefined);
      selection.setFullTextFilter('error');

      // when
      const pinned = pinnedColumnsOf(selection, new Query());

      // then
      expect([...pinned]).toEqual([]);
   });

   function queryOf(filter: PropertyFilter): Query {
      return new Query(filter);
   }
});
