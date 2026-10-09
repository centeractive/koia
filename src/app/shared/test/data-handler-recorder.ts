import { DataHandler } from '../services/reader/data-handler.type';

export class DataHandlerRecorder implements DataHandler {

   readonly values: string[][] = [];
   readonly entries: object[] = [];
   readonly completion: Promise<void>;
   private resolve: () => void;
   private reject: (error: unknown) => void;

   constructor() {
      this.completion = new Promise<void>((resolve, reject) => {
         this.resolve = resolve;
         this.reject = reject;
      });
   }

   onValues(rows: string[][]): void {
      this.values.push(...rows);
   }

   onEntries(entries: object[]): void {
      this.entries.push(...entries);
   }

   onError(error: unknown): void {
      this.reject(error);
   }

   onComplete(): void {
      this.resolve();
   }

   isCanceled(): boolean {
      return false;
   }
}
