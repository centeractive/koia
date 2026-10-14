import { Route } from '../../model';
import { TabDef, ViewType } from '../../model/view-config';

const TAB_ID_PREFIX = 'tab';
const TAB_ID_PATTERN = /^tab(\d+)$/;
const TITLES: Record<ViewType, string> = {
   [ViewType.PIVOT]: 'Pivot Table',
   [ViewType.DASHBOARD]: 'Dashboard'
};

export function createTabDef(type: ViewType, seq: number, tabs: TabDef[] = []): TabDef {
   return { id: TAB_ID_PREFIX + seq, type, title: nextTitle(TITLES[type], tabs) };
}

function nextTitle(base: string, tabs: TabDef[]): string {
   const titles = new Set(tabs.map(t => t.title));
   let title = base;
   for (let n = 2; titles.has(title); n++) {
      title = base + ' ' + n;
   }
   return title;
}

export function maxTabSeq(tabs: TabDef[]): number {
   return tabs
      .map(t => TAB_ID_PATTERN.exec(t.id))
      .filter(match => !!match)
      .reduce((max, match) => Math.max(max, parseInt(match[1])), 0);
}

export function tabPath(id: string): string {
   return Route.VIEW + '/' + id;
}

export function tabUrl(id: string): string {
   return '/' + tabPath(id);
}

export function hasContent(tab: TabDef): boolean {
   if (tab.type === ViewType.DASHBOARD) {
      return !!tab.view?.elements.length;
   }
   const pivotOptions = tab.record?.data?.pivotOptions;
   return !!(pivotOptions?.cols?.length || pivotOptions?.rows?.length);
}

export function iconOf(tab: TabDef, layout?: Route): string {
   if (tab.type === ViewType.PIVOT) {
      return 'pivot_table';
   }
   return (layout ?? tab.view?.route) === Route.FLEX ? 'flex_view' : 'grid_view';
}
