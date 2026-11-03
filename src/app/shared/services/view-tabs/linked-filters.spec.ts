import { DataType, Operator, PropertyFilter, Query } from '../../model';
import { LinkedFilters } from '../../model/view-config';
import { filtersOf, withoutPendingKey } from './linked-filters';

describe('linked-filters', () => {

   it('#filtersOf given query with sort and page definition then returns its filters only', () => {

      // given
      const query = new Query(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));
      query.setSort({ active: 'Level', direction: 'asc' });
      query.setPageDefinition(2, 100);

      // when
      const filters = filtersOf(query);

      // then
      expect(filters.propertyFilters).toEqual([{ name: 'Level', operator: Operator.EQUAL, value: 'ERROR', dataType: DataType.TEXT }]);
      expect(filters.sort).toBeUndefined();
      expect(filters.pageIndex).toBeUndefined();
      expect(filters.rowsPerPage).toBeUndefined();
      expect(query.getSort()).toEqual({ active: 'Level', direction: 'asc' });
   });

   it('#withoutPendingKey given other keys left then removes the key', () => {

      // given
      const linkedFilters = linkedFiltersPendingFor('rawdata', 'tab1');

      // when
      const result = withoutPendingKey(linkedFilters, 'tab1');

      // then
      expect(result).toEqual({ ...linkedFilters, pendingKeys: ['rawdata'] });
      expect(linkedFilters.pendingKeys).toEqual(['rawdata', 'tab1']);
   });

   it('#withoutPendingKey given last key then returns undefined', () => {

      // when
      const result = withoutPendingKey(linkedFiltersPendingFor('tab1'), 'tab1');

      // then
      expect(result).toBeUndefined();
   });

   function linkedFiltersPendingFor(...pendingKeys: string[]): LinkedFilters {
      return { query: filtersOf(new Query()), pendingKeys };
   }
});
