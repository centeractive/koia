import { JSONReader } from './json-reader';
import { DataHandler } from '../data-handler.type';

describe('JSONReader', () => {

   const entries = [
      { A: 1, B: 'X', C: true },
      { A: 2, B: 'Y', C: false },
      { A: 3, B: 'X', C: true },
      { A: 4, B: 'Y', C: false },
      { A: 5, B: 'Z', C: true }
   ]
   const reader = new JSONReader();

   it('#getDescription should return description', () => {
      expect(reader.getDescription()).toBeDefined();
   });

   it('#getSourceName should return name', () => {
      expect(reader.getSourceName()).toBe('JSON');
   });

   it('#getFileExtension should return file extension', () => {
      expect(reader.getFileExtension()).toBe('.json');
   });

   it('#expectsPlainTextData should return true', () => {
      expect(reader.expectsPlainTextData()).toBeTruthy();
   });

   it('#furnishAttributes should return attributes', () => {

      // when
      const attributes = reader.furnishAttributes('');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(1);
   });

   it('#furnishAttributes should set path of root object array', (done) => {

      // given
      const data = JSON.stringify([{ x: 1, y: 'l' }, { x: 2, y: 'm' }, { x: 3, y: 'n' }, { x: 4, y: 'o' }]);
      const dataHeader = data.substring(0, data.length - 5);

      // when
      const attributes = reader.furnishAttributes(dataHeader);

      // then
      setTimeout(() => {
         expect(attributes).toBeDefined();
         expect(attributes.length).toBe(1);
         expect(attributes[0].value).toBe('$');
         expect(attributes[0].valueChoice).toEqual(['$']);
         expect(attributes[0].isValueChoiceBinding).toBeFalsy();
         done();
      }, 200);
   });

   it('#furnishAttributes should set paths of detected non-root object arrays', (done) => {

      // given
      const objArray = [{ x: 1, y: 'l' }, { x: 2, y: 'm' }, { x: 3, y: 'n' }];
      const data = JSON.stringify({
         obj: { t: 's' },
         numArr: [1, 2, 3, 4],
         objArr1: objArray,
         objArr2: objArray,
         Obj2: { nestObj: { objArr3: objArray } },
         strArr: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      });
      const dataHeader = data.substring(0, data.length - 5);

      // when
      const attributes = reader.furnishAttributes(dataHeader);

      // then
      setTimeout(() => {
         expect(attributes).toBeDefined();
         expect(attributes.length).toBe(1);
         expect(attributes[0].value).toBe('$.objArr1');
         expect(attributes[0].valueChoice).toEqual(['$.objArr1', '$.objArr2', '$.Obj2.nestObj.objArr3']);
         expect(attributes[0].isValueChoiceBinding).toBeFalsy();
         done();
      }, 200);
   });

   it('#readSample should return entries sample', (done) => {

      // given
      const url = createURL(JSON.stringify({ entries: entries }));
      reader.furnishAttributes('')[0].value = '$.entries';

      // when/then
      reader.readSample(url, 3)
         .then(sample => {
            const expected = entries.slice(0, 3);
            expect(sample.entries).toEqual(expected);
            expect(sample.columnNames).toBeUndefined();
            expect(sample.tableData).toBeUndefined();
            done();
         })
         .catch(err => fail(err));
   });

   it('#readSample should return all entries when when requested sample exceeds file size', (done) => {

      // given
      const url = createURL(JSON.stringify({ entries: entries }));
      reader.furnishAttributes('')[0].value = '$.entries';

      // when/then
      reader.readSample(url, 100)
         .then(sample => {
            expect(sample.entries).toEqual(entries);
            expect(sample.columnNames).toBeUndefined();
            expect(sample.tableData).toBeUndefined();
            done();
         })
         .catch(err => fail(err));
   });

   it('#readData should provide entries when array path is root', (done) => {

      // given
      const url = createURL(JSON.stringify(entries));
      reader.furnishAttributes('')[0].value = '$';

      // when/then
      let actual = [];
      const dataHandler: DataHandler = {
         onValues: rows => fail('no values expected'),
         onEntries: data => actual = actual.concat(data),
         onError: err => fail(err),
         onComplete: () => {
            expect(actual).toEqual(entries);
            done();
         },
         isCanceled: () => false
      }
      reader.readData(url, 2, dataHandler);
   });

   it('#readData should return provide entries when array path is not root', (done) => {

      // given
      const url = createURL(JSON.stringify({ entries: entries }));
      reader.furnishAttributes('')[0].value = '$.entries';

      // when/then
      let actual = [];
      const dataHandler: DataHandler = {
         onValues: rows => fail('no values expected'),
         onEntries: data => actual = actual.concat(data),
         onError: err => fail(err),
         onComplete: () => {
            expect(actual).toEqual(entries);
            done();
         },
         isCanceled: () => false
      }
      reader.readData(url, 2, dataHandler);
   });

   function createURL(s: string): string {
      return URL.createObjectURL(new Blob([s]));
   }
});
