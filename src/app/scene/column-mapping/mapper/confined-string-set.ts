/**
 * Holds a limited number of distinct string values but keeps track of all values (distinct and non-distinct),
 * which were attempted to be added
 */
export class ConfinedStringSet {

   private set = new Set<string>();
   private added = 0;

   constructor(private limit: number) { }

   /**
    * adds the specified values but retains them only as long as the set limit is not reached
    */
   addAll(values: string[]): void {
      values.forEach(v => this.add(v));
   }

   /**
    * adds the specified value but retains it only if set limit is not reached
    */
   add(value: string): void {
      if (this.set.size < this.limit) {
         this.set.add(value);
      }
      this.added++;
   }

   /**
    * @returns the number of added values regardless if they were discarded because the set limit was exceeded
    */
   size(): number {
      return this.added;
   }

   /**
    * @returns an array with all values currently retaiend by this set
    */
   toArray(): string[] {
      return Array.from(this.set.values());
   }

   clear(): void {
      this.set.clear();
      this.added = 0;
   }

   /**
    * @returns an string where each retained value appears on a new line plus an optional ending line with three dots ("...")
    * if an attempt was made to add more values than allowed by the set limit
    */
   toString(): string {
      const array = this.toArray();
      if (this.added > this.limit) {
         array.push('...');
      }
      return array.join('\n');
   }
}
