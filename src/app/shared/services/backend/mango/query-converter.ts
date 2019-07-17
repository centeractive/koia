import { Query, Column, Operator } from 'app/shared/model';
import { MangoQueryBuilder } from './mango-query-builder';
import { CouchDBConstants } from '../couchdb/couchdb-constants';

export class QueryConverter {

   private static readonly TABLE_STYLE_FIELDS = ['fgcolor', 'bgcolor'];

   constructor(private forPouchDB: boolean) { }

   /**
   * Converts a [[Query]] to a Mango query that contains the selector and a single field (no sorting nor pagination info)
   * to find out the total number of rows that match the selector of the base query.
   * Apparently there's no better way to find the total number of rows matching a certain selector.
   */
   queryForAllMatchingIds(columns: Column[], query: Query): Object {
      const builder = new MangoQueryBuilder(this.forPouchDB, columns)
         .includeFields([CouchDBConstants._ID]);
      this.defineFilters(builder, query);
      return builder.toQuery();
   }

   toMango(columns: Column[], query: Query): Object {
      const builder = new MangoQueryBuilder(this.forPouchDB, columns)
         .includeFields(this.defineFields(columns, query));
      this.defineFilters(builder, query);
      builder.sortBy(query.getSort());
      if (query.getPageIndex() >= 0 && query.getRowsPerPage() > 0) {
         builder.page(query.getPageIndex(), query.getRowsPerPage())
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
      query.getPropertyFilters().forEach(pf => builder.where(pf.propertyName, pf.operator, pf.filterValue));
      query.getValueRangeFilters().forEach(f =>
         f.toPropertyFilters().forEach(pf => builder.where(pf.propertyName, pf.operator, pf.filterValue))
      );
      if (!builder.containsFilter()) {
         builder.where(CouchDBConstants._ID, Operator.GREATER_THAN, null);
      }
   }
}
