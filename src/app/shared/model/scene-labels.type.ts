import { SceneInfo } from './scene-info.type';

export type SceneLabels = Pick<SceneInfo, '_id' | 'name' | 'shortDescription'>;
