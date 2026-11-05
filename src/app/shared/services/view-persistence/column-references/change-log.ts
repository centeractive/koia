interface Change {
   target: object;
   key: string;
   oldValue: unknown;
   absent: boolean;
}

/**
 * changes properties in place and remembers their previous values so that all changes can be undone
 */
export class ChangeLog {

   private readonly changes: Change[] = [];

   set(target: object, key: string, value: unknown): void {
      this.record(target, key);
      target[key] = value;
   }

   delete(target: object, key: string): void {
      this.record(target, key);
      delete target[key];
   }

   /**
    * restores the previous values, latest change first, and deletes keys that were absent before
    */
   undo(): void {
      this.changes.splice(0).reverse().forEach(c => {
         if (c.absent) {
            delete c.target[c.key];
         } else {
            c.target[c.key] = c.oldValue;
         }
      });
   }

   private record(target: object, key: string): void {
      this.changes.push({ target, key, oldValue: target[key], absent: !Object.hasOwn(target, key) });
   }
}
