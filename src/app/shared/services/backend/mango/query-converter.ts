import { MangoQueryBuilder } from './mango-query-builder';
import { CouchDBConstants } from '../couchdb/couchdb-constants';
import { Column, Query, Operator } from 'app/shared/model';

export class QueryConverter {

   static readonly TABLE_STYLE_FIELDS = ['fgcolor', 'bgcolor'];

   constructor(private forPouchDB: boolean) { }

   /**
   * Converts a [[Query]] to a Mango query that contains the selector, the sort (both backends omit documents lacking the sort field)
   * and a single field (no pagination info)
   * to find out the total number of rows that match the selector of the base query.
   * Apparently there's no better way to find the total number of rows matching a certain selector.
   */
   queryForAllMatchingIds(columns: Column[], query: Query): object {
      const builder = new MangoQueryBuilder(this.forPouchDB, columns)
         .includeFields([CouchDBConstants._ID]);
      this.defineFilters(builder, query);
      builder.sortBy(query.getSort());
      return builder.toQuery();
   }

   /**
    * @param columns the stored columns, the full text filter searches their text columns and filter values get their types
    * @param fieldColumns the columns whose values are fetched
    */
   toMango(columns: Column[], query: Query, fieldColumns = columns): object {
      const builder = new MangoQueryBuilder(this.forPouchDB, columns)
         .includeFields(this.defineFields(fieldColumns, query));
      this.defineFilters(builder, query);
      builder.sortBy(query.getSort());
      if (query.getPageIndex() >= 0 && query.getRowsPerPage() > 0) {
         builder.page(query.getPageIndex(), query.getRowsPerPage());
      }
      return builder.toQuery();
   }

   private defineFields(columns: Column[], query: Query): string[] {
      let fields = [CouchDBConstants._ID].concat(columns.map(c => c.name));
      if (query.getPageIndex() >= 0 && query.getRowsPerPage() > 0) {
         fields = fields.concat(QueryConverter.TABLE_STYLE_FIELDS);
      }
      return fields;
   }

   private defineFilters(builder: MangoQueryBuilder, query: Query): void {
      if (query.hasFullTextFilter()) {
         builder.whereAnyText(query.getFullTextFilter());
      }
      query.getPropertyFilters()
         .filter(f => f.isApplicable())
         .forEach(f => builder.where(f.name, f.operator, f.value, f.dataType));
      query.getValueRangeFilters()
         .filter(f => f.isApplicable())
         .filter(f => !f.inverted)
         .forEach(f => f.toPropertyFilters().forEach(pf => builder.where(pf.name, pf.operator, pf.value)));
      query.getValueRangeFilters()
         .filter(f => f.isApplicable())
         .filter(f => f.inverted)
         .forEach(f => builder.whereRangeInverted(f.clone()));
      if (!builder.containsFilter()) {
         builder.where(CouchDBConstants._ID, Operator.GREATER_THAN, null);
      }
   }
}
