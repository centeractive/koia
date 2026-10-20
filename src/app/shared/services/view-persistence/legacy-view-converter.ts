import { Route } from '../../model';
import { Config, ConfigRecord, RawDataSettings, SavedView, TabDef, View, ViewType } from '../../model/view-config';
import { CommonUtils, StringUtils } from '../../utils';
import { createDefaultRawDataState } from './raw-data-state-factory';

const LEGACY_TAB_ID = 'tab1';

/**
 * @returns views converted from legacy dashboard views and records, descending sorted by modified time, names taken by
 * reserved or newer views numbered " (2)", " (3)"...
 */
export function convertLegacyViews(config: Config, reservedNames: string[]): SavedView[] {
   const taken = new Set(reservedNames);
   return [...(config.views ?? []).map(fromDashboardView), ...(config.records ?? []).map(fromConfigRecord)]
      .sort((v1, v2) => v2.modifiedTime - v1.modifiedTime)
      .map(view => {
         view.name = StringUtils.uniqueName(view.name, taken);
         taken.add(view.name);
         return view;
      });
}

function fromDashboardView(view: View): SavedView {
   return withTab(view.name, view.modifiedTime, { id: LEGACY_TAB_ID, type: ViewType.DASHBOARD, title: view.name, view: CommonUtils.clone(view) });
}

function fromConfigRecord(record: ConfigRecord): SavedView {
   if (record.route === Route.RAWDATA) {
      return {
         name: record.name,
         modifiedTime: record.modifiedTime,
         tabs: [],
         rawData: { query: CommonUtils.clone(record.query), data: CommonUtils.clone(record.data) as RawDataSettings }
      };
   }
   return withTab(record.name, record.modifiedTime, { id: LEGACY_TAB_ID, type: ViewType.PIVOT, title: record.name, record: CommonUtils.clone(record) });
}

function withTab(name: string, modifiedTime: number, tab: TabDef): SavedView {
   return { name, modifiedTime, tabs: [tab], activeTabId: tab.id, rawData: createDefaultRawDataState() };
}
