import { Injectable } from '@angular/core';
import { DateTimeUtils, ArrayUtils } from '../utils';
import { ChartContext, PropertyFilter, ChartType, DataType, Column } from '../model';
import { largestTriangleThreeBucket } from 'd3fc-sample';
import { CouchDBConstants } from './backend/couchdb/couchdb-constants';
import { ValueRange } from '../value-range/model/value-range.type';

declare var d3: any;

@Injectable({
   providedIn: 'root'
})
export class ChartDataService {

   static readonly MAX_DATA_POINTS = 1_000;

   createData(context: ChartContext): ChartDataResult {
      context.dataSampledDown = false;
      context.valueRange = undefined;
      context.warning = undefined;
      const chartType = ChartType.fromType(context.chartType);
      if (context.isNonGrouping()) {
         return this.createSimpleChartData(chartType, context);
      } else if (chartType === ChartType.SUNBURST) {
         return { data: this.createGraphData(context) };
      } else if (context.isAggregationCountSelected()) {
         return this.valueCountData(chartType, context);
      } else {
         return this.individualValuesData(chartType, context);
      }
   }

   private createSimpleChartData(chartType: ChartType, context: ChartContext): ChartDataResult {
      const countDistinct = context.isAggregationCountSelected();
      if (!countDistinct && context.groupByColumns.length === 0) {
         return { error: 'Name column is not defined' };
      }
      try {
         const data = countDistinct ? this.countDistinctValues(context) : this.valuesOfDistinctNames(context);
         if (data.length > chartType.maxValues) {
            return this.exceedingValuesErrorResult(chartType);
         }
         context.valueRange = ArrayUtils.numberValueRange(data, 'y');
         if (chartType === ChartType.BAR) {
            return { data: [{ values: data }] };
         } else {
            return { data: data };
         }
      } catch (err) {
         return { error: (<Error> err).message };
      }
   }

   /**
    * @returns an array with DataPoints for every distict value found in the selected column
    * of the entries (DataPoint.x = <value> and DataPoint.y = <count>)
    */
   private countDistinctValues(context: ChartContext): DataPoint[] {
      const data: DataPoint[] = [];
      for (const entry of context.entries) {
         const value = entry[context.dataColumns[0].name];
         if (value != null) {
            const nameValueObject = ArrayUtils.findObjectByKeyValue(data, 'x', value);
            if (nameValueObject == null) {
               data.push({ x: value, y: 1 });
            } else {
               nameValueObject['y'] += 1;
            }
         }
      }
      return data;
   }

   private valuesOfDistinctNames(context: ChartContext): DataPoint[] {
      const nameColumn = context.groupByColumns[0];
      const dataColumn = context.dataColumns[0];
      const names = [];
      const data: DataPoint[] = [];
      for (const entry of context.entries) {
         const name = entry[nameColumn.name];
         const value = entry[dataColumn.name];
         if (name !== null && name !== undefined && value !== null && value !== undefined) {
            if (names.includes(name)) {
               throw new Error('Names are not unique');
            }
            names.push(name);
            data.push({ x: name, y: value });
         }
      }
      return data;
   }

   private createGraphData(context: ChartContext): Object[] {
      let entries = context.entries;
      for (const column of context.groupByColumns) {
         if (column.dataType === DataType.TIME) {
            entries = this.convertTime(context, column);
         }
      }
      let nest = d3.nest();
      context.groupByColumns.concat(context.dataColumns[0]) //
         .forEach(c => nest.key(entry => entry[c.name] || PropertyFilter.EMPTY_VALUE));
      nest = nest.rollup(v => v.length); // count elements
      const rootChildren = nest.entries(entries);
      rootChildren.forEach(n => this.transformTreeNode(n));
      return [{ name: 'Data', children: rootChildren }];
   }

   private convertTime(context: ChartContext, timeColumn: Column): Object[] {
      const entries: Object[] = [];
      context.entries.forEach(entry => {
         const date = DateTimeUtils.toDate(entry[timeColumn.name], timeColumn.groupingTimeUnit);
         if (date) {
            const clone = Object.assign({}, entry);
            clone[timeColumn.name] = DateTimeUtils.formatTime(date.getTime(), timeColumn.groupingTimeUnit);
            entries.push(clone);
         }
      });
      return entries;
   }

   private transformTreeNode(treeNode: Object): void {
      treeNode['name'] = treeNode['key'];
      delete treeNode['key'];
      if (Number.isInteger(treeNode['values'])) {
         treeNode['value'] = treeNode['values'];
      } else {
         treeNode['children'] = treeNode['values'];
         treeNode['children'].forEach(n => this.transformTreeNode(n));
      }
      delete treeNode['values'];
   }

   private valueCountData(chartType: ChartType, context: ChartContext): ChartDataResult {
      if (context.groupByColumns.length === 0) {
         return { error: 'X-Axis is not defined' };
      }
      const xAxisColumn = context.groupByColumns[0];
      const distinctXAxisValues = new Set<any>();
      const datasets: Object[] = [];
      context.entries.map((entry, index) => {
         const value = entry[context.dataColumns[0].name];
         if (value !== undefined && value != null) {
            const xAxisValue = this.extractXAxisValue(entry, xAxisColumn);
            distinctXAxisValues.add(xAxisValue);
            if (xAxisValue !== undefined && xAxisValue !== null) {
               this.addGroupValue(datasets, xAxisValue, value);
            }
         }
      });
      if (distinctXAxisValues.size > chartType.maxValues) {
         return this.exceedingValuesErrorResult(chartType);
      } else if (xAxisColumn.dataType === DataType.TIME) {
         datasets.forEach(ds => this.sortTimeAscending(ds['values']));
      }
      const valueRanges = datasets.map(ds => ArrayUtils.numberValueRange(ds['values'], 'y'));
      context.valueRange = ArrayUtils.overallValueRange(valueRanges);
      return { data: datasets };
   }

   private extractXAxisValue(entry: Object, xAxisColumn: Column) {
      let xAxisValue = entry[xAxisColumn.name];
      if (xAxisColumn.dataType === DataType.TIME && xAxisColumn.groupingTimeUnit) {
         const date = DateTimeUtils.toDate(xAxisValue, xAxisColumn.groupingTimeUnit);
         if (date) {
            xAxisValue = date.getTime();
         }
      }
      return xAxisValue;
   }

   private addGroupValue(datasets: Object[], xAxisValue: any, value: any): void {
      let dataset = ArrayUtils.findObjectByKeyValue(datasets, 'key', value);
      if (dataset == null) {
         dataset = { key: value, values: [] };
         datasets.push(dataset);
      }
      let dataPoint = this.findDataPoint(dataset['values'], xAxisValue);
      if (dataPoint == null) {
         dataPoint = { x: xAxisValue, y: 0 };
         dataset['values'].push(dataPoint);
      }
      dataPoint.y++;
   }

   private findDataPoint(datapoints: DataPoint[], value: any): DataPoint {
      for (const datapoint of datapoints) {
         if (datapoint.x === value) {
            return datapoint;
         }
      }
      return null;
   }

   private individualValuesData(chartType: ChartType, context: ChartContext): ChartDataResult {
      if (context.groupByColumns.length === 0) {
         return { error: 'X-Axis is not defined' };
      }
      const data = [];
      const valueRanges: ValueRange[] = [];
      for (const column of context.dataColumns) {
         const values = this.individualValuesSeries(context.entries, column, context.groupByColumns[0]);
         const distinctXValues = new Set(values.map(p => p.x));
         if (distinctXValues.size > chartType.maxValues) {
            return this.exceedingValuesErrorResult(chartType);
         }
         data.push({
            key: column.name,
            values: this.optionallySampleDown(values, context),
         });
         valueRanges.push(ArrayUtils.numberValueRange(values, 'y'));
      }
      context.valueRange = ArrayUtils.overallValueRange(valueRanges);
      return { data: data };
   }

   private individualValuesSeries(entries: Object[], column: Column, xAxisColumn: Column): DataPoint[] {
      const dataPoints: DataPoint[] = [];
      entries.map((entry, index) => {
         const yAxisValue: number = entry[column.name];
         if (yAxisValue != null && yAxisValue !== undefined) {
            const xAxisValue = entry[xAxisColumn.name];
            if (xAxisValue != null && xAxisValue !== undefined) {
               dataPoints.push({ id: entry[CouchDBConstants._ID], x: xAxisValue, y: yAxisValue });
            }
         }
      });
      if (xAxisColumn.dataType === DataType.TIME) {
         this.sortTimeAscending(dataPoints);
      }
      return dataPoints;
   }

   private sortTimeAscending(values: DataPoint[]): void {
      ArrayUtils.sortObjects(values, { active: 'x', direction: 'asc' });
   }

   private optionallySampleDown(values: DataPoint[], context: ChartContext): DataPoint[] {
      if (values.length <= ChartDataService.MAX_DATA_POINTS) {
         return values;
      }
      const sampler = largestTriangleThreeBucket();
      sampler.x(d => d.x).y(d => d.y);
      const bucketSize = Math.ceil(values.length / ChartDataService.MAX_DATA_POINTS);
      sampler.bucketSize(bucketSize);
      context.dataSampledDown = true;
      context.warning = 'Data has been down-sampled and the chart contains part of available values only,' +
         ' apply filters to limit the data and see all values of the chosen context.'
      return sampler(values);
   }

   private exceedingValuesErrorResult(chartType: ChartType) {
      return {
         error: chartType.name + ' chart: Maximum number of ' + chartType.maxValues + ' values exceeded.' +
            '\n\nPlease re-configure the chart or apply/refine data filtering.'
      };
   }
}

export interface ChartDataResult {
   data?: Object[];
   error?: string;
}

interface DataPoint {
   id?: number
   x: number;
   y: number;
}
