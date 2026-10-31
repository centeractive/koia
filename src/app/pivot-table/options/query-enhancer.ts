import * as _ from 'lodash';
import { ValueGrouping } from 'app/shared/value-range/model';
import { ArrayUtils, DateTimeUtils, QuerySanitizer, NumberUtils } from 'app/shared/utils';
import { Operator, PropertyFilter, Column, Query, DataType } from 'app/shared/model';
import { ValueRangeConverter } from 'app/shared/value-range';
import { columnOfLabel } from './pivot-labels';

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
         this.addFilter(columnOfLabel(filterLabel, this.columns), this.filters[filterLabel]);
      }
   }

   private addFilter(column: Column, filterValue: string | number | boolean): void {
      if (this.hasValueGrouping(column.name)) {
         this.addValueGroupingFilter(column, filterValue as string, false);
      } else if (filterValue === 'null') {
         this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.EMPTY, '', column.dataType));
      } else if (column.dataType === DataType.TIME) {
         this.addTimeRangeFilter(column, filterValue as string, false);
      } else {
         this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.EQUAL, filterValue, column.dataType));
      }
   }

   /**
    * adds filters dropping the rows PivotTable.js drops since their value of an attribute (label) not pinned by the filters is
    * excluded in its pop-up filter menu. Like PivotTable.js, they keep the rows lacking a value, a NOT_EMPTY filter drops them
    * when the empty value ('null', 'empty' for time columns and value groupings) is excluded too.
    *
    * @param exclusions excluded values per label (see https://github.com/nicolaskruchten/pivottable/wiki/Parameters)
    */
   addFiltersForValueChoices(exclusions: object): void {
      for (const [label, excludedValues] of Object.entries(exclusions)) {
         if (!this.filterLabels.includes(label)) {
            const column = columnOfLabel(label, this.columns);
            if (column.dataType === DataType.TIME) {
               excludedValues.forEach(v => this.addTimeRangeFilter(column, v, true));
            } else if (this.hasValueGrouping(column.name)) {
               excludedValues.forEach(v => this.addValueGroupingFilter(column, v, true));
            } else {
               this.addValueExclusionFilters(column, excludedValues);
            }
         }
      }
   }

   /**
    * 'null' is the label PivotTable.js shows for missing values. Numbers are excluded one by one to be compared exactly, as well
    * as texts that splitting and trimming the semicolon separated NONE_OF list would alter.
    */
   private addValueExclusionFilters(column: Column, excludedValues: string[]): void {
      if (excludedValues.includes('null')) {
         this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.NOT_EMPTY, '', column.dataType));
      }
      const values = excludedValues.filter(v => v !== 'null');
      if (column.dataType === DataType.NUMBER) {
         values.forEach(v => this.addNotEqualFilter(column, NumberUtils.parseMachineNumber(v)));
      } else {
         const [listedValues, singleValues] = _.partition(values, v => !v.includes(ArrayUtils.DEFAULT_SEPARATOR) && v === v.trim());
         if (listedValues.length) {
            this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.NONE_OF,
               listedValues.join(ArrayUtils.DEFAULT_SEPARATOR), column.dataType, true));
         }
         singleValues.forEach(v => this.addNotEqualFilter(column, v));
      }
   }

   private addNotEqualFilter(column: Column, value: string | number): void {
      this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.NOT_EQUAL, value, column.dataType, true));
   }

   private hasValueGrouping(columnName: string): boolean {
      return this.valueGroupings.find(vg => vg.columnName === columnName) !== undefined;
   }

   /**
    * the value group 'min - max' (no bounds) comprises all values
    */
   private addValueGroupingFilter(column: Column, filterValue: string, inverted: boolean): void {
      if (filterValue === ValueRangeConverter.EMPTY) {
         this.addEmptinessFilter(column, inverted);
         return;
      }
      const minValue = ValueRangeConverter.toMinValue(filterValue);
      const maxValue = ValueRangeConverter.toMaxValue(filterValue);
      if (inverted || minValue !== undefined || maxValue !== undefined) {
         this.query.addValueRangeFilter(column.name, minValue, maxValue, true, inverted, inverted);
      } else {
         this.query.addPropertyFilter(new PropertyFilter(column.name, Operator.NOT_EMPTY, '', column.dataType));
      }
   }

   private addTimeRangeFilter(column: Column, filterValue: string, inverted: boolean): void {
      if (filterValue === ValueRangeConverter.EMPTY) {
         this.addEmptinessFilter(column, inverted);
      } else {
         const timeStart = DateTimeUtils.parseFormattedTime(filterValue, column.groupingTimeUnit).getTime();
         const timeEnd = DateTimeUtils.addTimeUnits(timeStart, 1, column.groupingTimeUnit);
         this.query.addValueRangeFilter(column.name, timeStart, timeEnd, true, inverted, inverted);
      }
   }

   private addEmptinessFilter(column: Column, inverted: boolean): void {
      const operator = inverted ? Operator.NOT_EMPTY : Operator.EMPTY;
      this.query.addPropertyFilter(new PropertyFilter(column.name, operator, '', column.dataType));
   }

   getQuery(): Query {
      return new QuerySanitizer(this.query).sanitize();
   }
}
