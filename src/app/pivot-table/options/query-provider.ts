import { Query } from 'app/shared/model';

export interface QueryProvider {
   provide(): Query;
}
