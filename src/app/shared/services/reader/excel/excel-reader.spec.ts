import { DataType } from 'app/shared/model';
import { DateTime } from 'luxon';
import { DataHandlerRecorder } from 'app/shared/test';
import { ExcelReader } from './excel-reader';

describe('ExcelReader', () => {

   const EXCEL_FILE_URL = '/src/app/shared/services/reader/excel/test.xlsx';

   let reader: ExcelReader;

   beforeEach(() => {
      reader = new ExcelReader();
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
      expect(reader.expectsPlainTextData()).toBe(false);
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
      expect(attributes[0].hasValueChoice()).toBe(false);
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
         expect(entries[0]['c3']).toBe(true);
         expect(entries[1]['c3']).toBe(false);
         expect(formatDate(entries[0]['c4'])).toBe('05.06.2019');
         expect(formatDate(entries[1]['c4'])).toBe('06.06.2019');
      });
   });

   it('#readSample should be rejected when data is invalid', async () => {

      // given
      const file = new File([''], 'test.xlsx');
      vi.spyOn(reader, 'readEntries').mockRejectedValue('invalid data');

      // when
      const sample = reader.readSample(file, 2);

      // then
      await expect(sample).rejects.toBe('invalid data');
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
                  { c1: 'a', c2: 1, c3: true, c4: expect.anything() },
                  { c1: 'b', c2: 2, c3: false, c4: expect.anything() }
               ]
            });
            expect(formatDate(sample.entries[0]['c4'])).toBe('05.06.2019');
            expect(formatDate(sample.entries[1]['c4'])).toBe('06.06.2019');
         });
   });

   it('#readData should return all entries', async () => {

      // given
      const file = await loadExcelFile();
      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(file, 100, recorder);
      await recorder.completion;

      // then
      const entries = recorder.entries;
      expect(entries.length).toBe(3);
      expect(entries[0]['c1']).toBe('a');
      expect(entries[1]['c1']).toBe('b');
      expect(entries[2]['c1']).toBe('c');
      expect(entries[0]['c2']).toBe(1);
      expect(entries[1]['c2']).toBe(2);
      expect(entries[2]['c2']).toBe(3);
      expect(entries[0]['c3']).toBe(true);
      expect(entries[1]['c3']).toBe(false);
      expect(entries[2]['c3']).toBe(true);
      expect(formatDate(entries[0]['c4'])).toBe('05.06.2019');
      expect(formatDate(entries[1]['c4'])).toBe('06.06.2019');
      expect(formatDate(entries[2]['c4'])).toBe('07.06.2019');
   });

   it('#readData should return error when worksheet does not exist', async () => {

      // given
      const file = await loadExcelFile();
      reader.furnishAttributes('')[0].value = 'XYZ Sheet';
      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(file, 100, recorder);

      // then
      await expect(recorder.completion).rejects.toBe('Worksheet "XYZ Sheet" does not exist or cannot be parsed');
   });

   it('#readData should return error when data is invalid', async () => {

      // given
      vi.spyOn(reader, 'readEntries').mockRejectedValue('invalid data');
      const file = new File([''], 'test.xlsx');
      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(file, 100, recorder);

      // then
      await expect(recorder.completion).rejects.toBe('invalid data');
   });

   async function loadExcelFile(): Promise<File> {
      const response = await fetch(EXCEL_FILE_URL);
      if (response.ok) {
         const blob = await response.blob();
         return new File([blob], 'test.xlsx');
      }
      throw new Error('Excel file cannot be loaded: ' + response.statusText);
   }

   function formatDate(date: Date): string {
      return DateTime.fromJSDate(date).toFormat('dd.MM.yyyy');
   }
});
