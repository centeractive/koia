import type { Scene } from 'app/shared/model/scene.type';
import type { TabDef } from 'app/shared/model/view-config/tab-def.type';

export const SCENE_FILE_EXTENSION = '.koia';
export const SCENE_FILE_FORMAT = 'koia-scene-file';
export const SCENE_FILE_VERSION = 1;

/**
 * content of a .koia file, which is gzipped JSON; scene and entries are documents without _id and _rev
 */
export interface SceneFile {
   format: typeof SCENE_FILE_FORMAT;
   version: number;
   scene: Scene;
   tabs: TabDef[];
   entries: object[];
}
