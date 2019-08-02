import { CouchDBService } from '../services/backend/couchdb';

export class CouchDBServiceMock extends CouchDBService {

   constructor() {
      super(null);
   }

   listDatabases(): Promise<string[]> {
      return Promise.resolve(['data_1']);
   }
}
