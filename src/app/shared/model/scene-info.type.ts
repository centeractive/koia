import { Document } from './document.type';
import { ColumnPair } from './column-pair.type';

export interface SceneInfo extends Document {
   creationTime: number;
   name: string;
   shortDescription: string;
   database: string;
   columnMappings: ColumnPair[];
}
