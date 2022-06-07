import { Injectable } from '@angular/core';
import { ChartContext, ChartType, DataPoint, DataSet } from 'app/shared/model/chart';
import { ChartDataResult } from 'app/shared/model/chart/chart-data-result.type';
import { ChartData } from 'chart.js';
import { SeriesNameConverter } from './series-name-converter';
import { ErrorResultFactory } from './error-result-factory';
import { largestTriangleThreeBucket } from 'd3fc-sample';
import { ChartDataHelper } from './chart-data-helper';
import { ArrayUtils, DataTypeUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model';
import { CouchDBConstants } from '../backend/couchdb';
import { Column, DataType } from 'app/shared/model';

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
    try {
      if (context.isAggregationCountSelected()) {
        if (context.isCategoryChart()) {
          return { data: this.countDistinctValuesData(chartType, context) };
        } else {
          return { data: this.valueCountData(chartType, context) };
        }
      } else if (context.isCategoryChart() || context.groupByColumns[0]?.dataType === DataType.TEXT) {
        return { data: this.categoryData(chartType, context) };
      } else {
        return { data: this.individualValuesData(chartType, context) };
      }
    } catch (err) {
      return { error: (<Error>err).message };
    }
  }

  private countDistinctValuesData(chartType: ChartType, context: ChartContext): ChartData {
    const dataPoints = this.createDistinctValuesData(chartType, context);
    return {
      labels: dataPoints.map(p => p.x),
      datasets: [{
        label: context.dataColumns[0].name,
        data: dataPoints.map(p => p.y),
        backgroundColor: context.colorProvider.bgColors(dataPoints.length),
        borderColor: context.colorProvider.borderColors(dataPoints.length),
        hoverOffset: 10, // PIE & DOUGHNUT charts
        borderAlign: 'inner' // PIE & DOUGHNUT charts
      }]
    };
  }

  protected createDistinctValuesData(chartType: ChartType, context: ChartContext): DataPoint[] {
    const data = ChartDataHelper.countDistinctValues(context);
    if (data.length > chartType.maxValues) {
      throw this.errorResultFactory.exceedingValues(chartType);
    }
    context.valueRange = ArrayUtils.numberValueRange(data, 'y');
    return data;
  }

  private categoryData(chartType: ChartType, context: ChartContext): ChartData {
    if (context.groupByColumns.length === 0) {
      throw this.errorResultFactory.toError('Name column is not defined');
    }
    const labeledData = ChartDataHelper.categoryData(context);
    if (labeledData.labels.length > chartType.maxValues) {
      throw this.errorResultFactory.exceedingValues(chartType);
    }
    const labels = labeledData.labels;
    const colorPerLabel = this.useDifferentColorPerLabel(chartType, context);
    context.valueRange = ArrayUtils.categoryDataToValueRange(labeledData);
    return {
      labels: labels,
      datasets: labeledData.dataSets.map((ds, i) => {
        const bgColors = context.colorProvider.bgColors(labels.length);
        const borderColors = context.colorProvider.borderColors(labels.length);
        return {
          label: ds.label,
          data: ds.values,
          backgroundColor: colorPerLabel ? bgColors : bgColors[i],
          borderColor: colorPerLabel ? borderColors : borderColors[i],
          fill: chartType == ChartType.AREA,
          hoverOffset: 10, // PIE & DOUGHNUT charts
          borderAlign: 'inner' // PIE & DOUGHNUT charts
        }
      })
    };
  }

  private useDifferentColorPerLabel(chartType: ChartType, context: ChartContext): boolean {
    switch (chartType) {
      case ChartType.PIE:
      case ChartType.DOUGHNUT:
      case ChartType.POLAR_AREA:
        return true;
      case ChartType.BAR:
      case ChartType.HORIZONTAL_BAR:
        return context.dataColumns.length === 1;
      default:
        return false;
    }
  }

  private valueCountData(chartType: ChartType, context: ChartContext): ChartData {
    const datasets = this.createValueCountData(chartType, context);
    const bgColors = context.colorProvider.bgColors(datasets.length);
    const borderColors = context.colorProvider.borderColors(datasets.length);
    return {
      datasets: datasets.map((ds, i) => ({
        label: ds.key,
        data: ds.values,
        backgroundColor: bgColors[i],
        borderColor: borderColors[i],
        fill: chartType == ChartType.AREA
      }))
    };
  }

  private individualValuesData(chartType: ChartType, context: ChartContext): ChartData {
    const datasets = this.createIndividualValuesData(chartType, context);
    const bgColors = context.colorProvider.bgColors(datasets.length);
    const borderColors = context.colorProvider.borderColors(datasets.length);
    return {
      datasets: datasets.map((ds, i) => ({
        label: ds.key,
        data: ds.values,
        backgroundColor: bgColors[i],
        borderColor: borderColors[i],
        fill: chartType == ChartType.AREA
      }))
    };
  }

  protected createValueCountData(chartType: ChartType, context: ChartContext): DataSet[] {
    if (context.groupByColumns.length === 0) {
      throw this.errorResultFactory.groupByColumnNotDefined(chartType);
    }
    const distinctGroupingValues = new Set<any>();
    const datasets: DataSet[] = [];
    context.entries.map(entry => {
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
      throw this.errorResultFactory.exceedingValues(chartType);
    } else if (DataTypeUtils.isNumeric(context.groupByColumns[0].dataType)) {
      datasets.forEach(ds => ChartDataHelper.sortAscending(ds.values));
    }
    const valueRanges = datasets.map(ds => ArrayUtils.numberValueRange(ds.values, 'y'));
    context.valueRange = ArrayUtils.overallValueRange(valueRanges);
    return datasets;
  }

  private addGroupValue(datasets: DataSet[], key: string, value: number): void {
    let dataset = datasets.find(ds => ds.key == key);
    if (dataset == undefined) {
      dataset = { key: key, values: [] };
      datasets.push(dataset);
    }
    let dataPoint = ChartDataHelper.findDataPoint(dataset.values, value);
    if (dataPoint == undefined) {
      dataPoint = { x: value, y: 0 };
      dataset.values.push(dataPoint);
    }
    dataPoint.y++;
  }

  protected createIndividualValuesData(chartType: ChartType, context: ChartContext): DataSet[] {
    if (context.groupByColumns.length === 0) {
      throw this.errorResultFactory.groupByColumnNotDefined(chartType);
    }
    const data: DataSet[] = [];
    const valueRanges: ValueRange[] = [];
    for (const dataColumn of context.dataColumns) {
      const namedSeries = this.createIndividualValuesSeries(context.entries, dataColumn, context);
      for (const seriesName of Array.from(namedSeries.keys())) {
        const dataPoints = namedSeries.get(seriesName);
        const distinctXValues = new Set(dataPoints.map(p => p.x));
        if (distinctXValues.size > chartType.maxValues) {
          throw this.errorResultFactory.exceedingValues(chartType);
        }
        data.push({
          key: seriesName,
          values: this.optionallySampleDown(dataPoints, context),
        });
        valueRanges.push(ArrayUtils.numberValueRange(dataPoints, 'y'));
      }
    }
    context.valueRange = ArrayUtils.overallValueRange(valueRanges);
    return data;
  }

  protected createIndividualValuesSeries(entries: Object[], dataColumn: Column, context: ChartContext):
    Map<string, DataPoint[]> {
    const namedSeries = new Map<string, DataPoint[]>();
    entries.map(entry => {
      const seriesName = this.dataNameConverter.toSeriesName(entry, dataColumn, context.splitColumns);
      if (seriesName) {
        let dataPoints = namedSeries.get(seriesName);
        if (dataPoints == undefined) {
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
    Array.from(namedSeries.values()).forEach(dataPoints => ChartDataHelper.sortAscending(dataPoints));
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
