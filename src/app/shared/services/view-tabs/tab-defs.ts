import { Route } from '../../model';
import { TabDef, ViewType } from '../../model/view-config';
import { Language, LANGUAGES, languageOf } from '../language/language';
import { LanguageService } from '../language/language.service';
import { DASHBOARD_TAB_TITLES, PIVOT_TABLE_TAB_TITLES } from './tab-titles';

interface PivotOptionsHolder { pivotOptions?: { cols?: unknown[], rows?: unknown[] }; }

const TAB_ID_PREFIX = 'tab';
const TAB_ID_PATTERN = /^tab(\d+)$/;

/**
 * default tab titles, the title is persisted in the language that is current when the tab is created
 */
const TITLES: Record<ViewType, Readonly<Record<Language, string>>> = {
   [ViewType.PIVOT]: PIVOT_TABLE_TAB_TITLES,
   [ViewType.DASHBOARD]: DASHBOARD_TAB_TITLES
};

export function createTabDef(type: ViewType, seq: number, tabs: TabDef[] = []): TabDef {
   return { id: TAB_ID_PREFIX + seq, type, title: nextTitle(TITLES[type], tabs) };
}

/**
 * numbers the title of the current language when a tab of the same type exists already, regardless of the language of its title
 */
function nextTitle(titlesByLanguage: Readonly<Record<Language, string>>, tabs: TabDef[]): string {
   const base = titlesByLanguage[languageOf(LanguageService.localeId())];
   const bases = [...new Set(LANGUAGES.map(l => titlesByLanguage[l]))];
   const titles = new Set(tabs.map(t => t.title));
   const taken = (suffix: string) => bases.some(b => titles.has(b + suffix));
   if (!taken('')) {
      return base;
   }
   let n = 2;
   while (taken(' ' + n)) {
      n++;
   }
   return base + ' ' + n;
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
   const pivotOptions = (tab.record?.data as PivotOptionsHolder)?.pivotOptions;
   return !!(pivotOptions?.cols?.length || pivotOptions?.rows?.length);
}

export function iconOf(tab: TabDef, layout?: Route): string {
   if (tab.type === ViewType.PIVOT) {
      return 'pivot_table';
   }
   return (layout ?? tab.view?.route) === Route.FLEX ? 'flex_view' : 'grid_view';
}
