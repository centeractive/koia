import { Document } from './document.type';

export interface SceneActivation extends Document {
   sceneId: string;
   lastActivationTime: number;
}
