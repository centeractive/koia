import { ValueGrouping } from 'app/shared/value-range/model';
import { ArrayUtils, DateTimeUtils, QuerySanitizer, ColumnNameConverter } from 'app/shared/utils';
import { Operator, PropertyFilter, Column, Query, DataType } from 'app/shared/model';
import { ValueRangeConverter } from 'app/shared/value-range';

/**
 * responsible for enhancing the query used to request raw data of a specific pivot table cell
 */
export class QueryEnhancer {

   private filterLabels: string[];

   constructor(private query: Query, private columns: Column[], private valueGroupings: ValueGrouping[], private filters: object) {
      this.filterLabels = Object.keys(filters);
   }

   addBasicFilters(): void {
      for (const filterLabel of this.filterLabels) {
         const columnName = ColumnNameConverter.toColumnName(filterLabel);
         const column = this.columns.find(c => c.name === columnName);
         this.addFilter(column, this.filters[filterLabel]);
      }
   }

   private addFilter(column: Column, filterValue: any): void {
      if (this.hasValueGrouping(column.name)) {
         this.addValueGroupingFilter(column, filterValue, false);
      } else if (filterValue === 'null') {
         this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.EMPTY, '', column.dataType));
      } else if (column.dataType === DataType.TIME) {
         this.addTimeRangeFilter(column, filterValue, false);
      } else {
         this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.EQUAL, filterValue, column.dataType));
      }
   }

   /**
    * adds filters required to match the value choices the user made in the pop-up filter menus of individual attributes (labels)
    *
    * @param exclusions excluded values (see https://github.com/nicolaskruchten/pivottable/wiki/Parameters)
    * @param inclusions included values (see https://github.com/nicolaskruchten/pivottable/wiki/Parameters)
    * @param pivotData PivotTable.js data model (see https://github.com/nicolaskruchten/pivottable/wiki/Renderers#the-pivotdata-object)
    *
    * @TODO consider inclusions instead of exclusions in cases the latter have more values
    */
   addFiltersForValueChoices(exclusions: object, inclusions: object, pivotData: object): void {
      if (exclusions) {
         const labelsInUse = pivotData['colAttrs'].concat(pivotData['rowAttrs']);
         for (const label of labelsInUse) {
            if (!this.filterLabels.includes(label) && exclusions[label]) {
               const column = this.columns.find(c => c.name === ColumnNameConverter.toColumnName(label));
               if (column.dataType === DataType.TIME) {
                  exclusions[label].forEach(v => this.addTimeRangeFilter(column, v, true));
               } else if (this.hasValueGrouping(label)) {
                  exclusions[label].forEach(v => this.addValueGroupingFilter(column, v, true));
               } else {
                  const values = exclusions[label].join(ArrayUtils.DEFAULT_SEPARATOR);
                  this.query.addPropertyFilter(new PropertyFilter(label, Operator.NONE_OF, values, column.dataType));
               }
            }
         }
      }
   }

   private hasValueGrouping(columnName: string): boolean {
      return this.valueGroupings.find(vg => vg.columnName === columnName) !== undefined;
   }

   private addValueGroupingFilter(column: Column, filterValue: any, inverted: boolean): void {
      if (filterValue === ValueRangeConverter.EMPTY) {
         const operator = inverted ? Operator.NOT_EMPTY : Operator.EMPTY;
         this.query.addPropertyFilter(new PropertyFilter(column.name, operator, '', column.dataType));
      } else {
         const minValue = ValueRangeConverter.toMinValue(filterValue);
         const maxValue = ValueRangeConverter.toMaxValue(filterValue);
         this.query.addValueRangeFilter(column.name, minValue, maxValue, true, inverted);
      }
   }

   private addTimeRangeFilter(column: Column, filterValue: any, inverted: boolean): void {
      const ngFormat = DateTimeUtils.ngFormatOf(column.groupingTimeUnit);
      if (filterValue === ValueRangeConverter.EMPTY) {
         const operator = inverted ? Operator.NOT_EMPTY : Operator.EMPTY;
         this.query.addPropertyFilter(new PropertyFilter(column.name, operator, '', column.dataType));
      } else {
         const timeStart = DateTimeUtils.parseDate(filterValue, ngFormat).getTime();
         const timeEnd = DateTimeUtils.addTimeUnits(timeStart, 1, column.groupingTimeUnit);
         this.query.addValueRangeFilter(column.name, timeStart, timeEnd, true, inverted);
      }
   }

   getQuery(): Query {
      return new QuerySanitizer(this.query).sanitize();
   }
}
