import { Query } from '../../model';
import { RawDataState } from '../../model/view-config';
import { queryToQueryDef } from './filter/query-to-filter-converter';

/**
 * @returns the state of a raw data tab that was not changed by the user
 */
export function createDefaultRawDataState(): RawDataState {
   return {
      query: queryToQueryDef(new Query()),
      data: {
         considerColumnWidths: true,
         highlight: true,
         multiLine: false,
         columnWidths: {}
      }
   };
}
