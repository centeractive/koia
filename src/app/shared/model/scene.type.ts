import { Column } from './column.type';
import { ContextInfo } from './context-info.type';
import { SceneInfo } from './scene-info.type';
import { Config } from './config.type';

export interface Scene extends SceneInfo {
   context?: ContextInfo[];
   columns: Column[];
   config: Config;
}
