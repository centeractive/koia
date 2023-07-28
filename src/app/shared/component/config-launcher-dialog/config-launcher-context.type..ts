import { ConfigRecord } from 'app/shared/model/view-config';

export interface ConfigLauncherContext {
   configRecords: ConfigRecord[];
   loadConfig(configRecord: ConfigRecord): void;
}
