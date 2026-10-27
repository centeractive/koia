export interface Sample {
   columnNames?: string[];
   tableData?: string[][];
   entries?: object[];
   /** source column that holds log levels */
   levelColumn?: string;
}
