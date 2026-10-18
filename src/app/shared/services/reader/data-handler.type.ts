export interface EntryHandler {

   /**
    * @param entries flat (non-nested) objects that each contain attributes of JSON simple data types (string, number or boolean) only
    */
   onEntries(entries: object[]): void;

   onError(error: string | object): void;

   onComplete(): void;

   isCanceled(): boolean;
}

export interface DataHandler extends EntryHandler {

   onValues(rows: string[][]): void;
}
