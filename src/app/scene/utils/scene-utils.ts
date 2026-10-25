import { DatePipe } from '@angular/common';
import { ContextInfo, Scene } from 'app/shared/model';
import { DataReader, Sample } from 'app/shared/services/reader';
import { StringUtils } from 'app/shared/utils';

export class SceneUtils {

   static readonly SCENE_NAME_MAX_LENGTH = 40;

   private static readonly DATE_PIPE = new DatePipe('en-US');

   static createScene(db: string): Scene {
      return {
         creationTime: undefined,
         name: undefined,
         shortDescription: undefined,
         columnMappings: undefined,
         columns: undefined,
         database: db,
         config: {
            savedViews: []
         }
      }
   }

   static generateSceneName(reader: DataReader, file: File, existingNames: Set<string>): string {
      const fileName = file.name.replace(reader.getFileExtension(), '');
      const date = file.lastModified ? ' / ' + SceneUtils.DATE_PIPE.transform(file.lastModified, 'mediumDate') : '';
      return StringUtils.uniqueNameOf(suffix =>
         StringUtils.abbreviate(fileName, SceneUtils.SCENE_NAME_MAX_LENGTH - date.length - suffix.length) + date + suffix, existingNames);
   }

   static generateSceneDescription(reader: DataReader, file: File) {
      let name = reader.getSourceName() + ' ' + file.name;
      if (file.lastModified) {
         name += ' (modified on ' + SceneUtils.DATE_PIPE.transform(file.lastModified, 'medium') + ')';
      }
      return name;
   }

   static entriesFromTableData(sample: Sample): object[] {
      const columnNames = SceneUtils.columnNamesFrom(sample);
      return sample.tableData.map(row => SceneUtils.rowToEntry(columnNames, row));
   }

   private static rowToEntry(columnNames: string[], row: string[]) {
      const entry = {};
      for (let i = 0; i < columnNames.length; i++) {
         entry[columnNames[i]] = row[i];
      }
      return entry;
   }

   static columnNamesFrom(sample: Sample): string[] {
      const columnCount = sample.columnNames ? sample.columnNames.length : sample.tableData[0].length;
      const columnNames = new Set<string>();
      for (let i = 0; i < columnCount; i++) {
         const name = sample.columnNames?.[i];
         columnNames.add(StringUtils.uniqueName(StringUtils.isBlank(name) ? 'Column ' + (i + 1) : name, columnNames));
      }
      return Array.from(columnNames);
   }

   static fileContextInfo(file: File): ContextInfo[] {
      return [
         { name: 'File Name', value: file.name },
         { name: 'File Type', value: file.type },
         { name: 'File Modification Time', value: new Date(file.lastModified).toLocaleString() }
      ];
   }
}
