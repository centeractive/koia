import { Document } from './document.type';
import { ColumnPair } from './column-pair.type';

export interface SceneInfo extends Document {
   /**
    * scene format version the document complies with, absent in documents of writers predating scene formats (treated as 1.0)
    */
   schemaVersion?: string;
   creationTime: number;
   name: string;
   shortDescription: string;
   database: string;
   columnMappings: ColumnPair[];
}
