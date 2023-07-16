import { Attribute } from 'app/shared/model';
import { DataHandler } from './data-handler.type';
import { Sample } from './sample.type';

export interface DataReader {

   /**
    * @returns the description of this reader, this should contain useful information for the user
    */
   getDescription(): string;

   /**
    * @returns the data source name to be displayed
    */
   getSourceName(): string;

   /**
    * @returns file extension including the leading dot (i.e. ".log")
    */
   getFileExtension(): string;

   /**
    * indicates if the reader expects the source data to be of plain text.
    * - if [[true]], sample data will be displayed to assist the user in defining appropriate reader options
    * - if [[false]], no sample data will be displayed
    */
   expectsPlainTextData(): boolean;

   /**
    * @param dataHeader data header that may be used to refine contextual attribute values
    * @param locale that helps finding propper attributes
    * @returns attributes that may their values have modified by the user
    */
   furnishAttributes(dataHeader: string, locale: string): Attribute[];

   /**
    * reads a data sample from given URL
    *
    * @param file file to read data from
    * @param entriesCount number of lines to be read
    * @param encoding the character set that was used to encode the file
    * @returns a [[Sample]] that must provide the data in [[Sample#tableData]] or [[Sample#entries]] and may propose column names
    */
   readSample(file: File, entriesCount: number, encoding?: string): Promise<Sample>;

   /**
    * reads the full data from given URL and streams it to either [[DataHandler#onValues]] or [[DataHandler#onEntries]]
    *
    * @param file file to read data from
    * @param chunkSize preferred number of rows/entries to deliver together to the [[DataHandler]]. Readers are not strictly
    * bound to observe this parameter
    * @param encoding the character set that was used to encode the file
    */
   readData(file: File, chunkSize: number, dataHandler: DataHandler, encoding?: string): void;
}
