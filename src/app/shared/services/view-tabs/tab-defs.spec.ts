import { Route } from '../../model';
import { ConfigRecord, TabDef, View, ViewType } from '../../model/view-config';
import { createTabDef, hasContent, iconOf, maxTabSeq, tabPath, tabUrl } from './tab-defs';

describe('tab-defs', () => {

   it('#createTabDef should create pivot table tab', () => {

      // when
      const tab = createTabDef(ViewType.PIVOT, 3);

      // then
      expect(tab).toEqual({ id: 'tab3', type: ViewType.PIVOT, title: 'Pivot Table 3' });
   });

   it('#createTabDef should create dashboard tab', () => {

      // when
      const tab = createTabDef(ViewType.DASHBOARD, 1);

      // then
      expect(tab).toEqual({ id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard 1' });
   });

   it('#maxTabSeq should return 0 when no tabs exist', () => {

      // when
      const seq = maxTabSeq([]);

      // then
      expect(seq).toBe(0);
   });

   it('#maxTabSeq should return highest sequence number of matching ids', () => {

      // given
      const tabs = [createTabDef(ViewType.PIVOT, 2), createTabDef(ViewType.DASHBOARD, 12), createTabDef(ViewType.PIVOT, 7)];

      // when
      const seq = maxTabSeq(tabs);

      // then
      expect(seq).toBe(12);
   });

   it('#maxTabSeq should ignore non-matching ids', () => {

      // given
      const tabs: TabDef[] = [{ id: 'other99', type: ViewType.PIVOT, title: 'X' }, createTabDef(ViewType.PIVOT, 4)];

      // when
      const seq = maxTabSeq(tabs);

      // then
      expect(seq).toBe(4);
   });

   it('#tabPath should return path without leading slash', () => {

      // when
      const path = tabPath('tab5');

      // then
      expect(path).toBe('view/tab5');
   });

   it('#tabUrl should return absolute url', () => {

      // when
      const url = tabUrl('tab5');

      // then
      expect(url).toBe('/view/tab5');
   });

   it('#hasContent should return false when dashboard has no view', () => {

      // when
      const result = hasContent(createTabDef(ViewType.DASHBOARD, 1));

      // then
      expect(result).toBe(false);
   });

   it('#hasContent should return false when dashboard view has no elements', () => {

      // given
      const tab = { ...createTabDef(ViewType.DASHBOARD, 1), view: view(Route.GRID, 0) };

      // when
      const result = hasContent(tab);

      // then
      expect(result).toBe(false);
   });

   it('#hasContent should return true when dashboard view has elements', () => {

      // given
      const tab = { ...createTabDef(ViewType.DASHBOARD, 1), view: view(Route.GRID, 1) };

      // when
      const result = hasContent(tab);

      // then
      expect(result).toBe(true);
   });

   it('#hasContent should return false when pivot has no record', () => {

      // when
      const result = hasContent(createTabDef(ViewType.PIVOT, 1));

      // then
      expect(result).toBe(false);
   });

   it('#hasContent should return false when pivot has neither rows nor columns', () => {

      // given
      const tab = { ...createTabDef(ViewType.PIVOT, 1), record: record({ cols: [], rows: [] }) };

      // when
      const result = hasContent(tab);

      // then
      expect(result).toBe(false);
   });

   it('#hasContent should return true when pivot has columns', () => {

      // given
      const tab = { ...createTabDef(ViewType.PIVOT, 1), record: record({ cols: ['Level'], rows: [] }) };

      // when
      const result = hasContent(tab);

      // then
      expect(result).toBe(true);
   });

   it('#hasContent should return true when pivot has rows', () => {

      // given
      const tab = { ...createTabDef(ViewType.PIVOT, 1), record: record({ cols: [], rows: ['Level'] }) };

      // when
      const result = hasContent(tab);

      // then
      expect(result).toBe(true);
   });

   it('#iconOf should return pivot table icon when pivot tab', () => {

      // when
      const icon = iconOf(createTabDef(ViewType.PIVOT, 1), Route.PIVOT);

      // then
      expect(icon).toBe('pivot_table');
   });

   it('#iconOf should return flex icon when layout is flex', () => {

      // when
      const icon = iconOf(createTabDef(ViewType.DASHBOARD, 1), Route.FLEX);

      // then
      expect(icon).toBe('flex_view');
   });

   it('#iconOf should return grid icon when layout is grid', () => {

      // when
      const icon = iconOf(createTabDef(ViewType.DASHBOARD, 1), Route.GRID);

      // then
      expect(icon).toBe('grid_view');
   });

   it('#iconOf should fall back to view route when layout is undefined', () => {

      // given
      const tab = { ...createTabDef(ViewType.DASHBOARD, 1), view: view(Route.FLEX, 0) };

      // when
      const icon = iconOf(tab, undefined);

      // then
      expect(icon).toBe('flex_view');
   });

   it('#iconOf should return grid icon when neither layout nor view is defined', () => {

      // when
      const icon = iconOf(createTabDef(ViewType.DASHBOARD, 1));

      // then
      expect(icon).toBe('grid_view');
   });

   function view(route: Route, elementCount: number): View {
      return {
         route, name: 'v', modifiedTime: 0, query: null, gridColumns: 3, gridCellRatio: '1:1',
         elements: Array.from({ length: elementCount }, () => null)
      };
   }

   function record(pivotOptions: object): ConfigRecord {
      return { route: Route.PIVOT, name: 'r', modifiedTime: 0, query: null, data: { pivotOptions } };
   }
});
