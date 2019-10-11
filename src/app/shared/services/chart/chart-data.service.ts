import { Injectable } from '@angular/core';
import { CouchDBConstants } from '../backend/couchdb/couchdb-constants';
import { ValueRange } from '../../value-range/model/value-range.type';
import { SeriesNameConverter } from './series-name-converter';
import { ChartDataHelper } from './chart-data-helper';
import { largestTriangleThreeBucket } from 'd3fc-sample';
import { ArrayUtils, DataTypeUtils } from 'app/shared/utils';
import { ChartDataResult, ChartType, ChartContext, DataPoint } from 'app/shared/model/chart';
import { Column, DataType, PropertyFilter } from 'app/shared/model';
import { ErrorResultFactory } from './error-result-factory';

declare var d3: any;

@Injectable({
   providedIn: 'root'
})
export class ChartDataService {

   static readonly MAX_DATA_POINTS = 1_000;

   private dataNameConverter = new SeriesNameConverter();
   private errorResultFactory = new ErrorResultFactory();

   createData(context: ChartContext): ChartDataResult {
      context.dataSampledDown = false;
      context.valueRange = undefined;
      context.warning = undefined;
      const chartType = ChartType.fromType(context.chartType);
      if (context.isNonGrouping()) {
         return this.createSimpleChartData(chartType, context);
      } else if (chartType === ChartType.SUNBURST) {
         return { data: this.createSunburstData(context) };
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
         const data = countDistinct ? ChartDataHelper.countDistinctValues(context) : ChartDataHelper.valuesOfDistinctNames(context);
         if (data.length > chartType.maxValues) {
            return this.errorResultFactory.exceedingValues(chartType);
         }
         context.valueRange = ArrayUtils.numberValueRange(data, 'y');
         if (chartType === ChartType.BAR) {
            return { data: [{ values: data }] };
         } else {
            return { data: data };
         }
      } catch (err) {
         return { error: (<Error>err).message };
      }
   }

   private createSunburstData(context: ChartContext): Object[] {
      let entries = context.entries;
      for (const column of context.groupByColumns) {
         if (column.dataType === DataType.TIME) {
            entries = ChartDataHelper.convertTime(context.entries, column);
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
         return this.errorResultFactory.groupByColumnNotDefined(chartType);
      }
      const distinctGroupingValues = new Set<any>();
      const datasets: Object[] = [];
      context.entries.map((entry, index) => {
         const key = this.dataNameConverter.toGroupKey(entry, context.dataColumns[0], context.splitColumns);
         if (key !== undefined && key !== null) {
            const groupingValue = ChartDataHelper.extractGroupingValue(entry, context.groupByColumns[0]);
            if (groupingValue !== null && groupingValue !== undefined) {
               distinctGroupingValues.add(groupingValue);
               this.addGroupValue(datasets, key, groupingValue);
            }
         }
      });
      if (distinctGroupingValues.size > chartType.maxValues) {
         return this.errorResultFactory.exceedingValues(chartType);
      } else if (DataTypeUtils.isNumeric(context.groupByColumns[0].dataType)) {
         datasets.forEach(ds => ChartDataHelper.sortAscending(ds['values']));
      }
      const valueRanges = datasets.map(ds => ArrayUtils.numberValueRange(ds['values'], 'y'));
      context.valueRange = ArrayUtils.overallValueRange(valueRanges);
      return { data: datasets };
   }

   private addGroupValue(datasets: Object[], key: string, value: number): void {
      let dataset = ArrayUtils.findObjectByKeyValue(datasets, 'key', key);
      if (dataset === null) {
         dataset = { key: key, values: [] };
         datasets.push(dataset);
      }
      let dataPoint = ChartDataHelper.findDataPoint(dataset['values'], value);
      if (dataPoint === undefined) {
         dataPoint = { x: value, y: 0 };
         dataset['values'].push(dataPoint);
      }
      dataPoint.y++;
   }

   private individualValuesData(chartType: ChartType, context: ChartContext): ChartDataResult {
      if (context.groupByColumns.length === 0) {
         return this.errorResultFactory.groupByColumnNotDefined(chartType);
      }
      const data = [];
      const valueRanges: ValueRange[] = [];
      for (const dataColumn of context.dataColumns) {
         const namedSeries = this.individualValuesSeries(context.entries, dataColumn, context);
         for (const seriesName of Array.from(namedSeries.keys())) {
            const dataPoints = namedSeries.get(seriesName);
            const distinctXValues = new Set(dataPoints.map(p => p.x));
            if (distinctXValues.size > chartType.maxValues) {
               return this.errorResultFactory.exceedingValues(chartType);
            }
            data.push({
               key: seriesName,
               values: this.optionallySampleDown(dataPoints, context),
            });
            valueRanges.push(ArrayUtils.numberValueRange(dataPoints, 'y'));
         }
      }
      context.valueRange = ArrayUtils.overallValueRange(valueRanges);
      return { data: data };
   }

   private individualValuesSeries(entries: Object[], dataColumn: Column, context: ChartContext):
      Map<string, DataPoint[]> {
      const namedSeries = new Map<string, DataPoint[]>();
      entries.map((entry, index) => {
         const seriesName = this.dataNameConverter.toSeriesName(entry, dataColumn, context.splitColumns);
         if (seriesName) {
            let dataPoints = namedSeries.get(seriesName);
            if (dataPoints === undefined) {
               dataPoints = [];
               namedSeries.set(seriesName, dataPoints);
            }
            const dataAxisValue: number = entry[dataColumn.name];
            if (dataAxisValue !== null && dataAxisValue !== undefined) {
               const groupingAxisValue = entry[context.groupByColumns[0].name];
               if (groupingAxisValue !== null && groupingAxisValue !== undefined) {
                  dataPoints.push({ id: entry[CouchDBConstants._ID], x: groupingAxisValue, y: dataAxisValue });
               }
            }
         }
      });
      for (const dataPoints of Array.from(namedSeries.values())) {
         ChartDataHelper.sortAscending(dataPoints);
      }
      return namedSeries;
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
}
