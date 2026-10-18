import { CouchDBConstants } from './couchdb/couchdb-constants';
import { sanitizeIndexQuery } from './mango/mango-query-sanitizer';

export interface IndexQuery {
  index: { fields: string[] };
  ddoc: string;
}

export function indexQueryOf(columnName: string): IndexQuery {
  return sanitizeIndexQuery({
    index: {
      fields: [columnName]
    },
    ddoc: CouchDBConstants.INDEX_DDOC_PREFIX + columnName
  });
}

export function deleteUnlessSystemDatabase<T>(database: string, del: () => Promise<T>): Promise<T> {
  if (database.startsWith('_')) {
    return Promise.reject('You have no permission to delete the system database ' + database);
  }
  return del();
}
