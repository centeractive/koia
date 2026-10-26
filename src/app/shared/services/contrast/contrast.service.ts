import { Injectable } from '@angular/core';
import { Column, Query } from 'app/shared/model';
import { CommonUtils } from 'app/shared/utils';
import { lastValueFrom } from 'rxjs';
import { DBService } from '../backend/db.service';
import { ContrastAnalyzer } from './contrast-analyzer';
import { ContrastResult } from './contrast.types';
import { pinnedColumnsOf } from './pinned-columns';

export interface ContrastAnalysis extends ContrastResult {

   /**
    * false if the selection is empty or comprises all rows of the base, there's nothing to compare then
    */
   comparable: boolean;
}

/**
 * explains the rows matching a selection by the column values they differ in from the rest of the rows matching a base
 */
@Injectable({
   providedIn: 'root'
})
export class ContrastService {

   private readonly analyzer = new ContrastAnalyzer();

   constructor(private dbService: DBService) { }

   /**
    * @param selection the query of the rows to be explained
    * @param base the query of the rows the selected rows are compared with, selected rows outside of it are ignored
    * @param columns the columns of the active scene
    */
   async explain(selection: Query, base: Query, columns: Column[]): Promise<ContrastAnalysis> {
      const [baseEntries, selectedIds] = await Promise.all([
         lastValueFrom(this.dbService.findEntries(this.unsortedAndUnpaged(base), true)),
         this.dbService.findMatchingIds(this.unsortedAndUnpaged(selection))
      ]);
      const selected = baseEntries.filter(e => selectedIds.has(e._id));
      if (selected.length === 0 || selected.length === baseEntries.length) {
         return { comparable: false, findings: [], skippedColumns: [] };
      }
      const rest = baseEntries.filter(e => !selectedIds.has(e._id));
      await CommonUtils.sleep(0); // lets the spinner appear before analyzing on the main thread
      const result = this.analyzer.analyze(selected, rest, columns, pinnedColumnsOf(selection, base));
      return { comparable: true, ...result };
   }

   /**
    * CouchDB omits documents lacking the sort field, hence sorting would drop rows
    */
   private unsortedAndUnpaged(query: Query): Query {
      const clone = query.clone();
      clone.clearSort();
      clone.clearPageDefinition();
      return clone;
   }
}
