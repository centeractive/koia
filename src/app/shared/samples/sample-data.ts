import { DataType } from 'app/shared/model/data-type.enum';
import type { Document } from 'app/shared/model/document.type';
import type { Scene } from 'app/shared/model/scene.type';
import type { TabDef } from 'app/shared/model/view-config/tab-def.type';

export interface SampleDef {
   id: string;
   /** file with the scene, its preconfigured view tabs and its entries */
   file: string;
   /** fixed _id of the sample scene */
   sceneId: string;
   sceneName: string;
   rowCount: number;
}

/**
 * content of a sample file, the time values of the entries are local dates of pattern 'yyyy-MM-dd'
 */
export interface SampleData {
   scene: Pick<Scene, 'name' | 'shortDescription' | 'context' | 'columns' | 'columnMappings' | 'config'>;
   tabs: TabDef[];
   entries: object[];
}

/**
 * converts the local dates of the time columns to their time at local midnight, the same as when importing a file
 */
export function toEntries(data: SampleData): Document[] {
   const timeColumns = data.scene.columns.filter(c => c.dataType === DataType.TIME).map(c => c.name);
   return data.entries.map(e => {
      const entry = { ...e };
      timeColumns.forEach(name => {
         const [year, month, day] = String(entry[name]).split('-').map(Number);
         entry[name] = new Date(year, month - 1, day).getTime();
      });
      return entry as Document;
   });
}
