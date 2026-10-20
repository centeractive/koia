import { resolve } from 'path';
import type { PivotContext } from 'app/pivot-table/model/pivot-context.type';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import type { TabDef } from 'app/shared/model/view-config/tab-def.type';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import type { SampleData } from 'app/shared/samples/sample-data';
import { Language } from 'app/shared/services/language/language';
import type { Chart } from 'app/shared/services/view-persistence/chart.type';
import { jsonOf, SRC_DIR } from './paths';

export function fruitSalesOf(language: Language): SampleData {
   return jsonOf<SampleData>(resolve(SRC_DIR, 'assets/samples', fruitSalesSampleOf(language).file));
}

export function pivotTabOf(sample: SampleData): TabDef {
   return sample.tabs.find(tab => tab.record);
}

export function dashboardTabOf(sample: SampleData): TabDef {
   return sample.tabs.find(tab => tab.view);
}

export function columnsOf(sample: SampleData, dataType: DataType): string[] {
   return sample.scene.columns.filter(column => column.dataType === dataType).map(column => column.name);
}

export function firstColumnOf(sample: SampleData, dataType: DataType): string {
   return columnsOf(sample, dataType)[0];
}

export function columnValuesOf<T>(sample: SampleData, column: string): T[] {
   return sample.entries.map(entry => entry[column]);
}

export function countOf(sample: SampleData, predicate: (entry: object) => boolean): number {
   return sample.entries.filter(predicate).length;
}

export function distinctValuesOf<T>(sample: SampleData, column: string): T[] {
   return [...new Set(columnValuesOf<T>(sample, column))].sort();
}

export function pivotRowColumnOf(tab: TabDef): string {
   return (tab.record.data as PivotContext).pivotOptions['rows'][0];
}

export function pivotTimeColumnOf(tab: TabDef): string {
   return (tab.record.data as PivotContext).timeColumns[0].name;
}

export function chartIndexOf(tab: TabDef, chartType: ChartType): number {
   return tab.view.elements.findIndex(element => (element as Chart).chartType === chartType.type);
}
