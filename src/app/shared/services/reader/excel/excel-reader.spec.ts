import { DataType } from 'app/shared/model';
import * as moment from 'moment';
import { DataHandler } from '../data-handler.type';
import { ExcelReader } from './excel-reader';

describe('ExcelReader', () => {

   const EXCEL_FILE_URL = '/base/src/app/shared/services/reader/excel/test.xlsx';

   let reader: ExcelReader;
   let dataHandler: DataHandler;

   beforeEach(() => {
      reader = new ExcelReader();
      dataHandler = {
         onValues: () => null,
         onEntries: () => null,
         onError: err => fail(err),
         onComplete: () => null,
         isCanceled: () => null
      };
   });

   it('#getDescription should return description', () => {
      expect(reader.getDescription()).toBeDefined();
   });

   it('#getSourceName should return name', () => {
      expect(reader.getSourceName()).toBe('Excel');
   });

   it('#getFileExtension should return file extension', () => {
      expect(reader.getFileExtension()).toBe('.xlsx');
   });

   it('#expectsPlainTextData should return false', () => {
      expect(reader.expectsPlainTextData()).toBeFalse();
   });

   it('#furnishAttributes should return attributes', () => {

      // when
      const attributes = reader.furnishAttributes('');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(1);
      expect(attributes[0].name).toBe('Sheet Name');
      expect(attributes[0].description).toBe('Name of Excel sheet that contains the data');
      expect(attributes[0].dataType).toBe(DataType.TEXT);
      expect(attributes[0].value).toBe('');
      expect(attributes[0].hasValueChoice()).toBeFalse();
   });

   it('#readSample should return sample data', async () => {

      // given
      const file = await loadExcelFile();

      // when
      await reader.readSample(file, 2).then(sample => {

         // then
         const entries = sample.entries;
         expect(entries.length).toBe(2);
         expect(entries[0]['c1']).toBe('a');
         expect(entries[1]['c1']).toBe('b');
         expect(entries[0]['c2']).toBe(1);
         expect(entries[1]['c2']).toBe(2);
         expect(entries[0]['c3']).toBeTruthy();
         expect(entries[1]['c3']).toBeFalse();
         expect(formatTime(entries[0]['c4'])).toBe('05.06.2019');
         expect(formatTime(entries[1]['c4'])).toBe('06.06.2019');
      });
   });

   it('#readSample should be rejected when data is invalid', async () => {

      // given
      const file = new File([''], 'test.xlsx');
      spyOn(reader, 'readEntries').and.returnValue(Promise.reject('invalid data'));

      // when
      await reader.readSample(file, 2)
         .then(() => fail('expected to be rejected'))
         .catch(err => {

            // then
            expect(err).toBe('invalid data');
         });
   });

   it('#readSample should return first two entries', async () => {

      // given
      const file = await loadExcelFile();

      // when
      await reader.readSample(file, 2)
         .then((sample) => {

            // then
            expect(sample).toEqual({
               entries: [
                  { c1: 'a', c2: 1, c3: true, c4: jasmine.anything() },
                  { c1: 'b', c2: 2, c3: false, c4: jasmine.anything() }
               ]
            });
            expect(formatTime(sample.entries[0]['c4'])).toBe('05.06.2019');
            expect(formatTime(sample.entries[1]['c4'])).toBe('06.06.2019');
         })
         .catch(() => fail('should not produce error'));
   });

   it('#readData should return all entries', (done) => {

      // given
      const request: XMLHttpRequest = createRequest();
      dataHandler.onComplete = () => done();

      request.onload = r => {
         const file = new File([request.response], 'test.xlsx');

         // when
         reader.readData(file, 100, dataHandler);
      };

      dataHandler.onEntries = entries => {

         // then
         expect(entries.length).toBe(3);
         expect(entries[0]['c1']).toBe('a');
         expect(entries[1]['c1']).toBe('b');
         expect(entries[2]['c1']).toBe('c');
         expect(entries[0]['c2']).toBe(1);
         expect(entries[1]['c2']).toBe(2);
         expect(entries[2]['c2']).toBe(3);
         expect(entries[0]['c3']).toBeTruthy();
         expect(entries[1]['c3']).toBeFalse();
         expect(entries[2]['c3']).toBeTruthy();
         expect(formatTime(entries[0]['c4'])).toBe('05.06.2019');
         expect(formatTime(entries[1]['c4'])).toBe('06.06.2019');
         expect(formatTime(entries[2]['c4'])).toBe('07.06.2019');
      };

      // trigger
      request.send(null);
   });

   it('#readData should return error when worksheet does not exist', (done) => {

      // given
      const request: XMLHttpRequest = createRequest();
      const file = new File([request.response], 'test.xlsx');
      reader.furnishAttributes('')[0].value = 'XYZ Sheet';

      dataHandler.onError = err => {

         // then
         expect(err).toBe('Worksheet "XYZ Sheet" does not exist');
         done();
      };

      // when
      reader.readData(file, 100, dataHandler);
   });

   it('#readData should return error when data is invalid', (done) => {

      // given
      const request: XMLHttpRequest = createRequest();
      spyOn(reader, 'readEntries').and.returnValue(Promise.reject('invalid data'));
      const file = new File([request.response], 'test.xlsx');

      dataHandler.onError = err => {

         // then
         expect(err).toBe('invalid data');
         done();
      };

      // when
      reader.readData(file, 100, dataHandler);
   });

   async function loadExcelFile(): Promise<File> {
      const response = await fetch(EXCEL_FILE_URL);
      const blob = await response.blob();
      return new File([blob], 'test.xlsx');
   }

   function createRequest(): XMLHttpRequest {
      const request = new XMLHttpRequest();
      request.open('GET', EXCEL_FILE_URL, true);
      request.responseType = 'arraybuffer';
      return request;
   }

   function formatTime(time: number): string {
      return moment(time).format('DD.MM.YYYY');
   }
});
