import { ContextInfo, Scene } from 'app/shared/model';
import { Sample, DataReader } from '../../shared/services/reader';
import { DatePipe } from '@angular/common';

export class SceneUtils {

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
            records: [],
            views: []
         }
      }
   }

   static generateSceneName(reader: DataReader, file: File) {
      let name = file.name.replace(reader.getFileExtension(), '');
      if (file.lastModified) {
        name += ' / ' + SceneUtils.DATE_PIPE.transform(file.lastModified, 'mediumDate');
      }
      return name;
   }

   static generateSceneDescription(reader: DataReader, file: File) {
      let name = reader.getSourceName() + ' ' + file.name;
      if (file.lastModified) {
         name += ' (modified on ' + SceneUtils.DATE_PIPE.transform(file.lastModified, 'medium') + ')';
      }
      return name;
   }

   static entriesFromTableData(sample: Sample): Object[] {
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

   private static columnNamesFrom(sample: Sample): string[] {
      const columnCount = sample.columnNames ? sample.columnNames.length : sample.tableData[0].length;
      const columns: string[] = [];
      for (let i = 0; i < columnCount; i++) {
         if (sample.columnNames && sample.columnNames[i] && sample.columnNames[i] !== '') {
            columns.push(sample.columnNames[i]);
         } else {
            columns.push('Column ' + (i + 1));
         }
      }
      return columns;
   }

   static fileContextInfo(file: File): ContextInfo[] {
      return [
         { name: 'File Name', value: file.name },
         { name: 'File Type', value: file.type },
         { name: 'File Modification Time', value: new Date(file.lastModified).toLocaleString() }
      ];
   }
}
