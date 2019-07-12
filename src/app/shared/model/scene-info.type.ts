import { Document } from './document.type';

export interface SceneInfo extends Document {
   creationTime: number;
   name: string;
   shortDescription: string;
   database: string;
}
