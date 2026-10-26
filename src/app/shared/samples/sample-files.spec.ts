import { PivotContext } from 'app/pivot-table/model/pivot-context.type';
import { DataType, ElementContext, TimeUnit } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ViewToModelConverter } from 'app/shared/services/view-persistence/view-to-model-converter';
import { hasContent } from 'app/shared/services/view-tabs/tab-defs';
import { ColumnNameConverter } from 'app/shared/utils';
import { appLogsSampleOf } from './app-logs.sample';
import { fruitSalesSampleOf } from './fruit-sales.sample';
import { LANGUAGES } from 'app/shared/services/language';
import { Language } from 'app/shared/services/language';
import { SampleData, SampleDef, toEntries } from './sample-data';

describe('sample files', () => {

   const languages = LANGUAGES;
   const samples: [string, (language: Language) => SampleDef][] = [['fruit sales', fruitSalesSampleOf], ['app logs', appLogsSampleOf]];

   async function dataOf(def: SampleDef): Promise<SampleData> {
      const response = await fetch('/assets/samples/' + def.file);
      expect(response.ok).toBe(true);
      return response.json();
   }

   /**
    * replaces localized names, titles and values in order to compare the structure of samples of different languages
    */
   function structureOf(data: SampleData): string {
      return JSON.stringify({ scene: data.scene, tabs: data.tabs }, (key, value) =>
         ['name', 'title', 'columnName', 'value', 'shortDescription'].includes(key) ? '-' :
            ['rows', 'cols', 'vals'].includes(key) ? value.length : value);
   }

   it('sample scene ids should differ per sample and language', () => {

      // when
      const sceneIds = new Set(samples.flatMap(([, sampleOf]) => languages.map(l => sampleOf(l).sceneId)));

      // then
      expect(sceneIds.size).toBe(samples.length * languages.length);
   });

   describe.each(samples)('%s', (_, sampleOf) => languages.forEach(language => describe(language, () => {

      const def = sampleOf(language);

      it('should contain scene with expected number of entries', async () => {

         // when
         const data = await dataOf(def);

         // then
         expect(data.scene.name).toBe(def.sceneName);
         expect(data.entries.length).toBe(def.rowCount);
         expect(data.scene.columnMappings.map(m => m.target)).toEqual(data.scene.columns);
         const columnNames = data.scene.columns.map(c => c.name);
         data.entries.forEach(e => expect(Object.keys(e)).toEqual(columnNames));
      });

      it('should have same structure as english sample', async () => {

         // when
         const data = await dataOf(def);

         // then
         expect(structureOf(data)).toBe(structureOf(await dataOf(sampleOf('en'))));
      });

      it('should convert dates to local midnight', async () => {

         // given
         const data = await dataOf(def);

         // when
         const entries = toEntries(data);

         // then
         const timeColumn = data.scene.columns.find(c => c.dataType === DataType.TIME).name;
         expect(entries[0][timeColumn]).toBe(new Date(2024, 0, 1).getTime());
         expect(data.entries[0][timeColumn]).toBe('2024-01-01');
      });

      it('should contain pivot and dashboard tab', async () => {

         // when
         const tabs: TabDef[] = (await dataOf(def)).tabs;

         // then
         expect(tabs.map(t => [t.id, t.type])).toEqual([['tab1', ViewType.PIVOT], ['tab2', ViewType.DASHBOARD]]);
         expect(tabs[0].record.name).toBe(tabs[0].title);
         expect(tabs[1].view.name).toBe(tabs[1].title);
         tabs.forEach(t => expect(hasContent(t)).toBe(true));
      });

      it('should refer to scene columns in pivot table', async () => {

         // given
         const data = await dataOf(def);
         const columnNames = data.scene.columns.map(c => c.name);
         const context = data.tabs[0].record.data as PivotContext;

         // then
         context.timeColumns.forEach(c => {
            expect(columnNames).toContain(c.name);
            expect(c.dataType).toBe(DataType.TIME);
            expect(c.groupingTimeUnit).toBe(TimeUnit.MONTH);
         });
         const labels = columnNames.concat(context.timeColumns.map(c => ColumnNameConverter.toLabel(c, c.groupingTimeUnit)));
         const options = context.pivotOptions as { rows: string[], cols: string[], vals: string[] };
         [...options.rows, ...options.cols, ...options.vals].forEach(n => expect(labels).toContain(n));
      });

      it('should restore every dashboard element with scene columns', async () => {

         // given
         const data = await dataOf(def);
         const columnNames = data.scene.columns.map(c => c.name);
         const view = data.tabs[1].view;

         // when
         const contexts = new ViewToModelConverter(data.scene.columns).convert(view.elements);

         // then
         expect(contexts.length).toBe(view.elements.length);
         contexts.forEach((c: ElementContext) => {
            [...c.dataColumns, ...c.splitColumns, ...c.groupByColumns].forEach(col => expect(columnNames).toContain(col?.name));
         });
         view.elements.forEach(e => [e['baseScale'], ...(e['valueScales'] || [])]
            .filter(s => s?.columnName)
            .forEach(s => expect(columnNames).toContain(s.columnName)));
      });

      it('should render chart data from sample entries', async () => {

         // given
         const data = await dataOf(def);
         const entries = toEntries(data);
         const charts = new ViewToModelConverter(data.scene.columns).convert(data.tabs[1].view.elements)
            .filter(c => c instanceof ChartContext);

         // when
         const results = charts.map(c => {
            c.entries = entries;
            return new ChartDataService().createData(c as ChartContext);
         });

         // then
         expect(results.length).toBeGreaterThan(0);
         results.forEach(r => {
            expect(r.error).toBeUndefined();
            expect(r.data.datasets.length).toBeGreaterThan(0);
         });
      });
   })));
});
