import { ConfigRecord } from 'app/shared/model/view-config';

export interface ManageConfigContext {
   configRecords: ConfigRecord[];
   updateConfigRecords(deletedRecords: ConfigRecord[], renamedRecords: ConfigRecord[]): void
}
