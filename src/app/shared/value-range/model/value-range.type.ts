export interface ValueRange {
   min?: number;
   max: number;
   maxExcluding?: boolean; // must be true for grouping value ranges only
   active?: boolean;
}
