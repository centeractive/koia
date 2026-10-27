import { LinePattern } from './line-pattern';

/**
 * assembles log entries from lines, lines that do not match the pattern (i.e. stack traces) are appended to the entry
 * before; an entry is passed on not before it is complete, which is when the next entry starts or all lines were added
 */
export class LogEntryAssembler {

   private pending: Record<string, unknown> | undefined;

   /**
    * @param onEntry receives each complete entry, returns false when no more entries are wanted
    */
   constructor(private readonly pattern: LinePattern, private readonly onEntry: (entry: object) => boolean) { }

   /**
    * @returns false when no more entries are wanted
    */
   add(line: string): boolean {
      if (!line.trim()) {
         return true;
      }
      const entry = this.pattern.match(line);
      if (entry) {
         const wanted = this.finish();
         this.pending = entry;
         return wanted;
      }
      const name = this.pattern.continuationName;
      if (this.pending && name) {
         this.pending[name] = this.pending[name] + '\n' + line;
      }
      return true;
   }

   /**
    * passes on the pending entry
    *
    * @returns false when no more entries are wanted
    */
   finish(): boolean {
      const entry = this.pending;
      this.pending = undefined;
      return entry ? this.onEntry(entry) : true;
   }
}
