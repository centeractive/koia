export interface DataHandler {

   onValues(rows: string[][]): void;

   /**
    * @param entries flat (non-nested) objects that each contain attributes of JSON simple data types (string, number or boolean) only
    */
   onEntries(entries: object[]): void;

   onError(error: any): void;

   onComplete(): void;

   isCanceled(): boolean;
}
