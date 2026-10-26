/**
 * - VALUE: a regular value
 * - EMPTY: the field is missing
 * - NULL: the field is stored as null (by third party writers only)
 * - BLANK: the field is stored as an empty string (by third party writers only)
 */
export enum ValueKind {
   VALUE = 'value',
   EMPTY = 'empty',
   NULL = 'null',
   BLANK = 'blank'
}

/**
 * a column value that is over-represented among the selected rows
 */
export interface ContrastFinding {
   column: string;
   kind: ValueKind;

   /**
    * the value of kind [[ValueKind.VALUE]], undefined for other kinds
    */
   value?: string | number | boolean;
   selectedCount: number;
   selectedShare: number;
   restShare: number;
   lift: number;
   z: number;

   /**
    * true if the value does not appear outside of the selected rows
    */
   isNew: boolean;
}

export interface ContrastResult {
   findings: ContrastFinding[];

   /**
    * text columns not analyzed because they have too many distinct values
    */
   skippedColumns: string[];
}
