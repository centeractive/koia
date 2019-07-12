import { ExcelReader } from './excel-reader';

describe('ExcelReader', () => {

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
      expect(reader.expectsPlainTextData()).toBeFalsy();
   });

   it('#furnishAttributes should return attributes', () => {

      // when
      const attributes = reader.furnishAttributes('');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(1);
   });
});
