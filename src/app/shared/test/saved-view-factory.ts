import { SavedView, TabDef } from '../model/view-config';
import { createDefaultRawDataState } from '../services/view-persistence/raw-data-state-factory';

export function savedViewOf(name: string, tabs: TabDef[] = [], modifiedTime = 1): SavedView {
  return { name, modifiedTime, tabs, rawData: createDefaultRawDataState() };
}
