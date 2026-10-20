import { Route } from 'app/shared/model';
import { Config, View } from 'app/shared/model/view-config';
import { Chart } from './chart.type';

interface Change {
   target: object;
   key: string;
   oldValue: unknown;
   absent: boolean;
}

/**
 * renames a column in persisted views and raw data config records
 */
export class ViewColumnRenamer {

   constructor(private previousName: string, private name: string) { }

   /**
    * renames the column in place in the views and raw data column widths of the specified config
    *
    * @returns a function that restores exactly the values changed by the rename
    */
   renameInConfig(config: Config): () => void {
      const changes: Change[] = [];
      config.views.forEach(v => this.renameView(v, changes));
      config.records
         .filter(r => r.route === Route.RAWDATA)
         .forEach(r => this.renameWidthKey((r.data as { columnWidths?: Record<string, number> }).columnWidths, changes));
      return () => changes.reverse().forEach(c => {
         if (c.absent) {
            delete c.target[c.key];
         } else {
            c.target[c.key] = c.oldValue;
         }
      });
   }

   renameInView(view: View): void {
      this.renameView(view, []);
   }

   /**
    * moves the value of the previous name to the new name, ignores a missing key or an undefined record
    */
   renameKey(record: Record<string, unknown>): void {
      this.renameWidthKey(record, []);
   }

   private renameView(view: View, changes: Change[]): void {
      view.elements.forEach(e => {
         [...e.dataColumns, ...e.splitColumns, ...e.groupByColumns]
            .filter(c => c.name === this.previousName)
            .forEach(c => this.set(c, 'name', this.name, changes));
         (e as Chart).valueScales?.filter(s => s.columnName === this.previousName)
            .forEach(s => this.set(s, 'columnName', this.name, changes));
      });
   }

   private renameWidthKey(record: Record<string, unknown>, changes: Change[]): void {
      if (record && Object.hasOwn(record, this.previousName)) {
         this.set(record, this.name, record[this.previousName], changes);
         this.record(record, this.previousName, changes);
         delete record[this.previousName];
      }
   }

   private set(target: object, key: string, value: unknown, changes: Change[]): void {
      this.record(target, key, changes);
      target[key] = value;
   }

   private record(target: object, key: string, changes: Change[]): void {
      changes.push({ target, key, oldValue: target[key], absent: !Object.hasOwn(target, key) });
   }
}
