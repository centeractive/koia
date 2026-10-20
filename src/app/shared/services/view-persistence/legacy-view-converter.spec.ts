import { ConfigRecord, View, ViewType } from 'app/shared/model/view-config';
import { Query, Route } from '../../model';
import { queryToQueryDef } from './filter/query-to-filter-converter';
import { convertLegacyViews } from './legacy-view-converter';
import { createDefaultRawDataState } from './raw-data-state-factory';

describe('convertLegacyViews', () => {

   const NOW = new Date().getTime();
   const A_MINUTE_AGO = NOW - 60_000;

   it('should convert dashboard view to view with single dashboard tab shown when restored', () => {

      // given
      const view = dashboardView('dashboard', NOW);

      // when
      const savedViews = convertLegacyViews({ views: [view] }, []);

      // then
      expect(savedViews.length).toBe(1);
      expect(savedViews[0].tabs).toEqual([{ id: 'tab1', type: ViewType.DASHBOARD, title: 'dashboard', view }]);
      expect(savedViews[0].activeTabId).toBe('tab1');
   });

   it('should convert pivot record to view with single pivot tab shown when restored', () => {

      // given
      const record = configRecord(Route.PIVOT, 'pivot', NOW);

      // when
      const savedViews = convertLegacyViews({ records: [record] }, []);

      // then
      expect(savedViews.length).toBe(1);
      expect(savedViews[0].tabs).toEqual([{ id: 'tab1', type: ViewType.PIVOT, title: 'pivot', record }]);
      expect(savedViews[0].activeTabId).toBe('tab1');
   });

   it('should convert raw data record to view without tabs keeping its query and settings', () => {

      // given
      const record = configRecord(Route.RAWDATA, 'raw', NOW);

      // when
      const savedViews = convertLegacyViews({ views: [], records: [record] }, []);

      // then
      expect(savedViews).toEqual([{ name: 'raw', modifiedTime: NOW, tabs: [], rawData: { query: record.query, data: record.data } }]);
   });

   it('should give views converted from dashboards and pivot tables default raw data state', () => {

      // given
      const config = { views: [dashboardView('dashboard', NOW)], records: [configRecord(Route.PIVOT, 'pivot', NOW)] };

      // when
      const savedViews = convertLegacyViews(config, []);

      // then
      expect(savedViews.map(v => v.rawData)).toEqual([createDefaultRawDataState(), createDefaultRawDataState()]);
   });

   it('should keep name and modified time of legacy views', () => {

      // given
      const config = { views: [dashboardView('dashboard', NOW)], records: [configRecord(Route.PIVOT, 'pivot', A_MINUTE_AGO)] };

      // when
      const savedViews = convertLegacyViews(config, []);

      // then
      expect(savedViews.map(v => [v.name, v.modifiedTime])).toEqual([['dashboard', NOW], ['pivot', A_MINUTE_AGO]]);
   });

   it('should number name of legacy view taken by reserved name', () => {

      // given
      const config = { views: [dashboardView('x', NOW)], records: [] };

      // when
      const savedViews = convertLegacyViews(config, ['x', 'x (2)']);

      // then
      expect(savedViews[0].name).toBe('x (3)');
   });

   it('should number name of older legacy view taken by newer legacy view', () => {

      // given
      const config = { views: [dashboardView('x', A_MINUTE_AGO)], records: [configRecord(Route.PIVOT, 'x', NOW)] };

      // when
      const savedViews = convertLegacyViews(config, []);

      // then
      expect(savedViews.map(v => [v.name, v.tabs[0].type])).toEqual([['x', ViewType.PIVOT], ['x (2)', ViewType.DASHBOARD]]);
   });

   it('should sort converted views descending by modified time', () => {

      // given
      const config = {
         views: [dashboardView('d1', A_MINUTE_AGO), dashboardView('d2', NOW)],
         records: [configRecord(Route.PIVOT, 'p1', NOW - 1)]
      };

      // when
      const savedViews = convertLegacyViews(config, []);

      // then
      expect(savedViews.map(v => v.name)).toEqual(['d2', 'p1', 'd1']);
   });

   it('should keep dashboards before records when modified times are equal', () => {

      // given
      const config = { views: [dashboardView('dashboard', NOW)], records: [configRecord(Route.PIVOT, 'pivot', NOW)] };

      // when
      const savedViews = convertLegacyViews(config, []);

      // then
      expect(savedViews.map(v => v.name)).toEqual(['dashboard', 'pivot']);
   });

   it('should return no views when config has no legacy views', () => {

      // when
      const savedViews = convertLegacyViews({}, []);

      // then
      expect(savedViews).toEqual([]);
   });

   it('should not share objects with legacy views', () => {

      // given
      const view = dashboardView('dashboard', NOW);
      const pivotRecord = configRecord(Route.PIVOT, 'pivot', NOW);
      const rawDataRecord = configRecord(Route.RAWDATA, 'raw', NOW);

      // when
      const savedViews = convertLegacyViews({ views: [view], records: [pivotRecord, rawDataRecord] }, []);

      // then
      expect(savedViews[0].tabs[0].view).not.toBe(view);
      expect(savedViews[1].tabs[0].record).not.toBe(pivotRecord);
      expect(savedViews[2].rawData.query).not.toBe(rawDataRecord.query);
      expect(savedViews[2].rawData.data).not.toBe(rawDataRecord.data);
   });

   function dashboardView(name: string, modifiedTime: number): View {
      return { route: Route.GRID, name, modifiedTime, query: null, gridColumns: 2, gridCellRatio: '1:1', elements: [] };
   }

   function configRecord(route: Route, name: string, modifiedTime: number): ConfigRecord {
      return {
         route, name, modifiedTime,
         query: queryToQueryDef(new Query()),
         data: { considerColumnWidths: false, highlight: true, multiLine: true, columnWidths: { a: 10 } }
      };
   }
});
