import { CouchDBService } from '../services/backend/couchdb';

export class CouchDBServiceMock extends CouchDBService {

   constructor() {
      super(null);
   }

   override listDatabases(): Promise<string[]> {
      return Promise.resolve(['data_1']);
   }
}
