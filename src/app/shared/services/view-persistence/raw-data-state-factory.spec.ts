import { CanvasPaging, Query } from '../../model';
import { queryToQueryDef } from './filter/query-to-filter-converter';
import { createDefaultRawDataState } from './raw-data-state-factory';

describe('createDefaultRawDataState', () => {

   it('should provide unfiltered query and default settings of raw data', () => {

      // when
      const state = createDefaultRawDataState();

      // then
      expect(state).toEqual({
         query: queryToQueryDef(new Query()),
         data: { considerColumnWidths: true, highlight: true, multiLine: false, columnWidths: {}, paging: CanvasPaging.NONE }
      });
   });
});
