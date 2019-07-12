import { Column } from './column.type';
import { ContextInfo } from './context-info.type';
import { Config } from '../config';
import { SceneInfo } from './scene-info.type';

export interface Scene extends SceneInfo {
   context?: ContextInfo[];
   columns: Column[];
   config: Config;
}
