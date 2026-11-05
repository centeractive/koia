import { ChangeLog } from './change-log';

/**
 * renames references to a column or removes them when there is no new name, every change goes through the log
 */
export class ReferenceEditor {

   constructor(private readonly previousName: string, private readonly name: string | undefined, private readonly log: ChangeLog) { }

   /**
    * edits the items of the specified array whose specified property names the column, ignores a missing array
    */
   editNamed(target: object, arrayKey: string, nameKey: string): void {
      const items: object[] = target[arrayKey];
      const matching = items?.filter(i => i[nameKey] === this.previousName) ?? [];
      if (matching.length === 0) {
         return;
      }
      if (this.name === undefined) {
         this.log.set(target, arrayKey, items.filter(i => !matching.includes(i)));
      } else {
         matching.forEach(i => this.log.set(i, nameKey, this.name));
      }
   }

   /**
    * edits the specified array of column names, ignores a missing array
    */
   editNames(target: object, arrayKey: string): void {
      const names: string[] = target[arrayKey];
      if (names?.includes(this.previousName)) {
         const edited = this.name === undefined
            ? names.filter(n => n !== this.previousName)
            : names.map(n => n === this.previousName ? this.name : n);
         this.log.set(target, arrayKey, edited);
      }
   }

   /**
    * moves the value of the previous name to the new name, ignores a missing key or an undefined record
    */
   editKey(record: Record<string, unknown>): void {
      if (record && Object.hasOwn(record, this.previousName)) {
         if (this.name !== undefined) {
            this.log.set(record, this.name, record[this.previousName]);
         }
         this.log.delete(record, this.previousName);
      }
   }
}
