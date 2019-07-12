export interface ValueRange {
   min?: number;
   max: number; // exclusive when used as grouping range
   active?: boolean;
}
