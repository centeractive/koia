import { Column, DataType } from 'app/shared/model';
import { IDataFrame } from 'data-forge';
import { NumberUtils } from 'app/shared/utils/number-utils';
import { ValueGrouping } from './model/value-grouping.type';
import { ValueRange } from './model/value-range.type';

/**
 * Generates default value groupings for number columns
 */
export class ValueGroupingGenerator {

   static readonly MIN_DISTINCT_VALUES = 100;
   static readonly MIN_NUMBER_OF_RANGES = 3;

   /**
    * generates a default value grouping for each NUMBER column from the specified base data if it has the expected number of
    * disctinct values ([[MIN_DISTINCT_VALUES]]).
    *
    * @param data base data
    * @param columns columns (included text columns will be ignored)
    * @returns an array of value groupings or an empty array
    */
   generate(data: IDataFrame<number, any>, columns: Column[]): ValueGrouping[] {
      const groupings: ValueGrouping[] = [];
      const numberColumns = columns.filter(c => c.dataType === DataType.NUMBER);
      for (const column of numberColumns) {
         const grouping = this.createConditionalGrouping(data, column.name, ValueGroupingGenerator.MIN_DISTINCT_VALUES);
         if (grouping) {
            groupings.push(grouping)
         }
      }
      return groupings;
   }

   /**
    * generates a default value grouping for the specified number column out of the provided data
    *
    * @param data base data
    * @param numberColumnName name of the number column
    * @returns an array of value groupings or an empty array
    */
   createGrouping(data: IDataFrame<number, any>, numberColumnName: string): ValueGrouping {
      return this.createConditionalGrouping(data, numberColumnName, 1);
   }

   /**
    * @returns value grouping or [[null]] if data has not the minimum required number of distinct values
    */
   private createConditionalGrouping(data: IDataFrame<number, any>, numberColumnName: string, minDistinctValues: number): ValueGrouping {
      const series = data.getSeries(numberColumnName).where(v => !isNaN(v));
      if (series.distinct().count() < minDistinctValues) {
         return null;
      }
      const min = series.min();
      const max = series.max();
      return {
         columnName: numberColumnName,
         ranges: this.generateRanges(min, max),
         minMaxValues: { min: min, max: max }
      };
   }

   private generateRanges(min: number, max: number): ValueRange[] {
      const ranges: ValueRange[] = [];
      const rangeDiff = this.computeRangeDiff(min, max);
      let rangeMax = this.defineTopMostRangeMax(min, max, rangeDiff);
      while (rangeMax > min) {
         ranges.push({ max: rangeMax, active: true });
         rangeMax -= rangeDiff;
         if (rangeDiff < 1) {
            rangeMax = parseInt('' + (Math.round(rangeMax * 1_000_000)), 10) / 1_000_000;
         }
      }
      return ranges;
   }

   private defineTopMostRangeMax(min: number, max: number, rangeDiff: number): number {
      let rangeMax = NumberUtils.roundUpBroad(max);
      while (rangeMax - rangeDiff >= max) {
         rangeMax -= rangeDiff;
      }
      if (rangeMax === max) {
         rangeMax -= rangeDiff;
      }
      if (max - min > 1) {
         rangeMax = Number(rangeMax.toFixed(1));
      }
      return rangeMax;
   }

   private computeRangeDiff(min: number, max: number): number {
      const absMax = Math.max(Math.abs(min), Math.abs(max));
      const rangeDiff = NumberUtils.basePowerOfTen(absMax);
      const diff = NumberUtils.diff(max, min);
      if (diff / rangeDiff >= ValueGroupingGenerator.MIN_NUMBER_OF_RANGES) {
         return rangeDiff;
      }
      if (diff > 5 && diff < 10) {
         return 1;
      }
      return NumberUtils.roundUpBroad(diff / 10);
   }
}
