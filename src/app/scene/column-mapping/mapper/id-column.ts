import { ColumnPair, DataType } from 'app/shared/model';
import { CouchDBService } from 'app/shared/services/backend/couchdb/couchdb.service';

/**
 * the optional first column numbering the stored entries, see [[EntryMapper]]
 */
export class IdColumn {

   static readonly NAME = 'ID';

   /**
    * fits the largest sequence number, a scene holds at most [[CouchDBService.MAX_DATA_ITEMS_PER_SCENE]] entries
    */
   private static readonly WIDTH = String(CouchDBService.MAX_DATA_ITEMS_PER_SCENE).length;

   /**
    * @returns the mappings without ID mapping, preceded by the existing or else a new ID mapping when the ID column is wanted
    */
   static applyTo(columnMappings: ColumnPair[], wanted: boolean): ColumnPair[] {
      const idPair = columnMappings.find(cp => cp.sequence);
      const mappings = columnMappings.filter(cp => !cp.sequence);
      return wanted ? [idPair ?? IdColumn.createPair(), ...mappings] : mappings;
   }

   private static createPair(): ColumnPair {
      const width = IdColumn.WIDTH;
      return {
         source: { name: IdColumn.NAME, dataType: DataType.NUMBER, width },
         target: { name: IdColumn.NAME, dataType: DataType.NUMBER, width, indexed: true },
         sequence: true
      };
   }
}
