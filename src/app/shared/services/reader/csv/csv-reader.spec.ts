import { CSVReader } from './csv-reader';
import { DataHandler } from '../data-handler.type';
import { DataType } from 'app/shared/model';

describe('CSVReader', () => {

   const header = 'A,B,C';
   const content =
      '1,X,true\n' + //
      '2,Y,false\n' + //
      '3,X,true\n' + //
      '4,Y,false\n' + //
      '5,Z,true';
   const expectedValues = [
      ['1', 'X', 'true'],
      ['2', 'Y', 'false'],
      ['3', 'X', 'true'],
      ['4', 'Y', 'false'],
      ['5', 'Z', 'true']
   ];
   let reader = new CSVReader();

   beforeEach(() => {
      reader = new CSVReader();
   });

   it('#getDescription should return description', () => {
      expect(reader.getDescription()).toBeDefined();
   });

   it('#getSourceName should return name', () => {
      expect(reader.getSourceName()).toBe('CSV');
   });

   it('#getFileExtension should return file extension', () => {
      expect(reader.getFileExtension()).toBe('.csv');
   });

   it('#expectsPlainTextData should return true', () => {
      expect(reader.expectsPlainTextData()).toBeTruthy();
   });

   it('#furnishAttributes should return attributes with default values', () => {

      // when
      const attributes = reader.furnishAttributes(undefined, 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);

      expect(attributes[0].name).toBe('First row contains column names');
      expect(attributes[0].description).toBeUndefined();
      expect(attributes[0].dataType).toBe(DataType.BOOLEAN);
      expect(attributes[0].value).toBeFalsy();
      expect(attributes[0].hasValueChoice()).toBeFalsy();

      expect(attributes[1].name).toBe('Separator');
      expect(attributes[1].description).toBeUndefined();
      expect(attributes[1].dataType).toBe(DataType.TEXT);
      expect(attributes[1].value).toBeUndefined();
      expect(attributes[0].hasValueChoice()).toBeFalsy();
   });

   it('#furnishAttributes should return has-no-header attribute when file header is single line', () => {

      // when
      const fileHeader = 'A,B,C';
      const attributes = reader.furnishAttributes(fileHeader, 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[0].value).toBeFalsy();
   });

   it('#furnishAttributes should return has-no-header attribute when first line contains number', () => {

      // when
      const fileHeader =
         'A,1,C\n' +
         'X,Y,Z\n';
      const attributes = reader.furnishAttributes(fileHeader, 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[0].value).toBeFalsy();
   });

   it('#furnishAttributes should return has-no-header attribute when first line contains boolean', () => {

      // when
      const fileHeader =
         'A,true,C\n' +
         'X,Y,Z\n';
      const attributes = reader.furnishAttributes(fileHeader, 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[0].value).toBeFalsy();
   });

   it('#furnishAttributes should return has-header attribute when first line contains text only', () => {

      // when
      const fileHeader =
         'A,B,C\n' +
         'X,Y,Z\n';
      const attributes = reader.furnishAttributes(fileHeader, 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[0].value).toBeTruthy();
   });

   it('#furnishAttributes should return comma separator attribute', () => {

      // when
      const attributes = reader.furnishAttributes('A,B,C|D', 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[1].value).toBe(',');
   });

   it('#furnishAttributes should return semicolon separator attribute', () => {

      // when
      const attributes = reader.furnishAttributes('A;B;C,D', 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[1].value).toBe(';');
   });

   it('#furnishAttributes should return colon separator attribute', () => {

      // when
      const attributes = reader.furnishAttributes('A:B:C,D', 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[1].value).toBe(':');
   });

   it('#furnishAttributes should return pipe separator attribute', () => {

      // when
      const attributes = reader.furnishAttributes('A|B|C,D', 'en-US');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(2);
      expect(attributes[1].value).toBe('|');
   });

   it('#readSample should return sample data only when file has no header', (done) => {

      // given
      const url = createURL(content);
      reader.furnishAttributes('', 'en-US')[0].value = false;

      // when/then
      const expectedData = expectedValues.slice(0, 3);
      reader.readSample(url, 3)
         .then(sample => {
            expect(sample.columnNames).toBeUndefined();
            expect(sample.tableData).toEqual(expectedData);
            expect(sample.entries).toBeUndefined();
            done();
         })
         .catch(err => fail(err));
   });

   it('#readSample should return all data when requested sample exceeds file size', (done) => {

      // given
      const url = createURL(content);
      reader.furnishAttributes('', 'en-US')[0].value = false;

      // when/then
      reader.readSample(url, 100)
         .then(sample => {
            expect(sample.columnNames).toBeUndefined();
            expect(sample.tableData).toEqual(expectedValues);
            expect(sample.entries).toBeUndefined();
            done();
         })
         .catch(err => fail(err));
   });

   it('#readSample should return column names and sample data when file has header', (done) => {

      // given
      const url = createURL(header + '\n' + content);
      reader.furnishAttributes('', 'en-US')[0].value = true;

      // when/then
      const expectedData = expectedValues.slice(0, 3);
      reader.readSample(url, 3)
         .then(sample => {
            expect(sample.columnNames).toEqual(['A', 'B', 'C']);
            expect(sample.tableData).toEqual(expectedData);
            expect(sample.entries).toBeUndefined();
            done();
         })
         .catch(err => fail(err));
   });

   it('#readData should return values when file has no header', (done) => {

      // given
      const url = createURL(content);
      reader.furnishAttributes('', 'en-US')[0].value = false;

      // when/then
      let values: string[][];
      const dataHandler: DataHandler = {
         onValues: rows => values = values ? values.concat(rows) : rows,
         onEntries: data => fail('no entries expected'),
         onError: err => fail(err),
         onComplete: () => {
            expect(values).toEqual(expectedValues);
            done();
         },
         isCanceled: () => false
      }
      reader.readData(url, 100, dataHandler);
   });

   it('#readValues should return values when file has header', (done) => {

      // given
      const url = createURL(header + '\n' + content);
      reader.furnishAttributes('', 'en-US')[0].value = true;

      // when/then
      let values: string[][];
      const dataHandler: DataHandler = {
         onValues: rows => values = values ? values.concat(rows) : rows,
         onEntries: data => fail('no entries expected'),
         onError: err => fail(err),
         onComplete: () => {
            expect(values).toEqual(expectedValues);
            done();
         },
         isCanceled: () => false
      }
      reader.readData(url, 100, dataHandler);
   });

   function createURL(text: string): string {
      return URL.createObjectURL(new Blob([text]));
   }
});
