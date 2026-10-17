import { LanguageService } from 'app/shared/services/language';
import { DataType } from 'app/shared/model';
import { DataHandlerRecorder } from 'app/shared/test';
import { JSONReader } from './json-reader';

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
      expect(reader.expectsPlainTextData()).toBe(true);
   });

   it('#furnishAttributes should return attributes', () => {

      // when
      const attributes = reader.furnishAttributes('');

      // then
      expect(attributes).toBeDefined();
      expect(attributes.length).toBe(1);
   });

   it('#furnishAttributes should set path of root object array', async () => {

      // given
      const data = JSON.stringify([{ x: 1, y: 'l' }, { x: 2, y: 'm' }, { x: 3, y: 'n' }, { x: 4, y: 'o' }]);
      const dataHeader = data.substring(0, data.length - 5);

      // when
      const attributes = reader.furnishAttributes(dataHeader);

      // then
      await vi.waitFor(() => expect(attributes[0].value).toBe('$'));
      expect(attributes.length).toBe(1);
      expect(attributes[0].valueChoice).toEqual(['$']);
   });

   it('#furnishAttributes should set paths of detected non-root object arrays', async () => {

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
      await vi.waitFor(() => expect(attributes[0].value).toBe('$.objArr1'));
      expect(attributes.length).toBe(1);
      expect(LanguageService.instant(attributes[0].name)).toBe('Array JSONPath');
      expect(LanguageService.instant(attributes[0].description)).toBe('JSONPath to the object array that contains the data');
      expect(attributes[0].dataType).toBe(DataType.TEXT);
      expect(attributes[0].hasValueChoice()).toBe(true);
      expect(attributes[0].valueChoice).toEqual(['$.objArr1', '$.objArr2', '$.Obj2.nestObj.objArr3']);
   });

   it('#readSample should return entries sample', async () => {

      // given
      const json = JSON.stringify({ entries: entries });
      const file = new File([json], 'Test.json');
      reader.furnishAttributes('')[0].value = '$.entries';

      // when
      const sample = await reader.readSample(file, 3);

      // then
      expect(sample.entries).toEqual(entries.slice(0, 3));
      expect(sample.columnNames).toBeUndefined();
      expect(sample.tableData).toBeUndefined();
   });

   it('#readSample should return all entries when when requested sample exceeds file size', async () => {

      // given
      const json = JSON.stringify({ entries: entries });
      const file = new File([json], 'Test.json');
      reader.furnishAttributes('')[0].value = '$.entries';

      // when
      const sample = await reader.readSample(file, 100);

      // then
      expect(sample.entries).toEqual(entries);
      expect(sample.columnNames).toBeUndefined();
      expect(sample.tableData).toBeUndefined();
   });

   it('#readData should provide entries when array path is root', async () => {

      // given
      const json = JSON.stringify(entries);
      const file = new File([json], 'Test.json');
      reader.furnishAttributes('')[0].value = '$';

      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(file, 2, recorder);
      await recorder.completion;

      // then
      expect(recorder.entries).toEqual(entries);
      expect(recorder.values).toEqual([]);
   });

   it('#readData should return provide entries when array path is not root', async () => {

      // given
      const json = JSON.stringify({ entries: entries });
      const file = new File([json], 'Test.json');
      reader.furnishAttributes('')[0].value = '$.entries';

      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(file, 2, recorder);
      await recorder.completion;

      // then
      expect(recorder.entries).toEqual(entries);
      expect(recorder.values).toEqual([]);
   });

   it('#readSample should return no entries when array is empty', async () => {

      // given
      const file = new File(['[]'], 'Test.json');
      reader.furnishAttributes('')[0].value = '$';

      // when
      const sample = await reader.readSample(file, 3);

      // then
      expect(sample).toEqual({ entries: [] });
   });

   it('#readSample should reject when file is corrupt', async () => {

      // given
      const file = new File(['{ "entries": [{ "A": } ]'], 'Test.json');
      reader.furnishAttributes('')[0].value = '$.entries';

      // when
      const sample = reader.readSample(file, 3);

      // then
      await expect(sample).rejects.toBeDefined();
   });

   it('#readData should report error when file is corrupt', async () => {

      // given
      const file = new File(['{ "entries": [{ "A": } ]'], 'Test.json');
      reader.furnishAttributes('')[0].value = '$.entries';
      const recorder = new DataHandlerRecorder();

      // when
      reader.readData(file, 2, recorder);

      // then
      await expect(recorder.completion).rejects.toBeDefined();
   });

   it('#readData should provide entries once when entry count equals chunk size', async () => {

      // given
      const file = new File([JSON.stringify(entries)], 'Test.json');
      reader.furnishAttributes('')[0].value = '$';
      const recorder = new DataHandlerRecorder();
      const onEntries = vi.spyOn(recorder, 'onEntries');

      // when
      reader.readData(file, entries.length, recorder);
      await recorder.completion;

      // then
      expect(onEntries).toHaveBeenCalledTimes(1);
      expect(recorder.entries).toEqual(entries);
   });
});
