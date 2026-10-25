import { SceneUtils } from './scene-utils';
import { DataReader } from 'app/shared/services/reader';
import { DatePipe } from '@angular/common';

describe('SceneUtils', () => {

   const datePipe = new DatePipe('en-US');
   const lastModified = new Date(2026, 9, 22).getTime();
   const tableData = [
      ['1', 'X', 'true'],
      ['2', 'Y', 'false'],
      ['3', 'Z', 'true']
   ];

   it('#createScene should return scene', () => {

      // when
      const scene = SceneUtils.createScene('data_1');

      // then
      expect(scene.database).toBe('data_1');
      expect(scene.config).toEqual({ savedViews: [] })

   });

   it('#generateSceneName should return nane when file modification date is available', () => {

      // given
      const dataReader = { getFileExtension: () => '.txt' } as DataReader;
      const file = createFile();

      // when
      const name = SceneUtils.generateSceneName(dataReader, file, new Set());

      // then
      const formattedDate = datePipe.transform(file.lastModified, 'mediumDate');
      expect(name).toBe('test / ' + formattedDate);
   });

   it('#generateSceneName should return nane when file modification date is not available', () => {

      // given
      const dataReader = { getFileExtension: () => '.txt' } as DataReader;
      const file = { name: 'test.txt' } as File;

      // when
      const name = SceneUtils.generateSceneName(dataReader, file, new Set());

      // then
      expect(name).toBe('test');
   });

   it('#generateSceneName should append number suffix when name is taken', () => {

      // given
      const dataReader = { getFileExtension: () => '.txt' } as DataReader;
      const file = new File([''], 'test.txt', { lastModified });

      // when
      const name = SceneUtils.generateSceneName(dataReader, file, new Set(['test / Oct 22, 2026']));

      // then
      expect(name).toBe('test / Oct 22, 2026 (2)');
   });

   it('#generateSceneName should abbreviate file name to keep date within max length', () => {

      // given
      const dataReader = { getFileExtension: () => '.txt' } as DataReader;
      const file = new File([''], 'x'.repeat(50) + '.txt', { lastModified });

      // when
      const name = SceneUtils.generateSceneName(dataReader, file, new Set());

      // then
      expect(name).toBe('x'.repeat(22) + '... / Oct 22, 2026');
      expect(name.length).toBe(SceneUtils.SCENE_NAME_MAX_LENGTH);
   });

   it('#generateSceneName should abbreviate file name to max length when file modification date is not available', () => {

      // given
      const dataReader = { getFileExtension: () => '.txt' } as DataReader;
      const file = { name: 'x'.repeat(50) + '.txt' } as File;

      // when
      const name = SceneUtils.generateSceneName(dataReader, file, new Set());

      // then
      expect(name).toBe('x'.repeat(37) + '...');
      expect(name.length).toBe(SceneUtils.SCENE_NAME_MAX_LENGTH);
   });

   it('#generateSceneName should abbreviate file name to keep number suffix within max length', () => {

      // given
      const dataReader = { getFileExtension: () => '.txt' } as DataReader;
      const file = new File([''], 'x'.repeat(50) + '.txt', { lastModified });

      // when
      const name = SceneUtils.generateSceneName(dataReader, file, new Set(['x'.repeat(22) + '... / Oct 22, 2026']));

      // then
      expect(name).toBe('x'.repeat(18) + '... / Oct 22, 2026 (2)');
      expect(name.length).toBe(SceneUtils.SCENE_NAME_MAX_LENGTH);
   });

   it('#generateSceneDescription should return description when file modification date is available', () => {

      // given
      const dataReader = { getSourceName: () => 'Text' } as DataReader;
      const file = createFile();

      // when
      const description = SceneUtils.generateSceneDescription(dataReader, file);

      // then
      const formattedDate = datePipe.transform(file.lastModified, 'medium');
      expect(description).toBe('Text test.txt (modified on ' + formattedDate + ')');
   });

   it('#generateSceneDescription should return description when file modification date is not available', () => {

      // given
      const dataReader = { getSourceName: () => 'Text' } as DataReader;
      const file = { name: 'test.txt' } as File;

      // when
      const description = SceneUtils.generateSceneDescription(dataReader, file);

      // then
      expect(description).toBe('Text test.txt');
   });

   it('#entriesFromTableData should return entries with keys derived from given column names', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ columnNames: ['A', 'B', 'C'], tableData: tableData });

      // then
      const expected = [
         { A: '1', B: 'X', C: 'true' },
         { A: '2', B: 'Y', C: 'false' },
         { A: '3', B: 'Z', C: 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#entriesFromTableData should return entries with generated keys', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ tableData: tableData });

      // then
      const expected = [
         { 'Column 1': '1', 'Column 2': 'X', 'Column 3': 'true' },
         { 'Column 1': '2', 'Column 2': 'Y', 'Column 3': 'false' },
         { 'Column 1': '3', 'Column 2': 'Z', 'Column 3': 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#entriesFromTableData should return entries with generated and derived keys', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ columnNames: ['', 'B', ''], tableData: tableData });

      // then
      const expected = [
         { 'Column 1': '1', B: 'X', 'Column 3': 'true' },
         { 'Column 1': '2', B: 'Y', 'Column 3': 'false' },
         { 'Column 1': '3', B: 'Z', 'Column 3': 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#entriesFromTableData should return entries with unique keys when column names are duplicate', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ columnNames: ['A', 'A', 'B'], tableData: tableData });

      // then
      const expected = [
         { A: '1', 'A (2)': 'X', B: 'true' },
         { A: '2', 'A (2)': 'Y', B: 'false' },
         { A: '3', 'A (2)': 'Z', B: 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#columnNamesFrom should append number to duplicate column names', () => {

      // when
      const columnNames = SceneUtils.columnNamesFrom({ columnNames: ['A', 'A', 'A'], tableData: tableData });

      // then
      expect(columnNames).toEqual(['A', 'A (2)', 'A (3)']);
   });

   it('#columnNamesFrom should append number to column name that collides with generated column name', () => {

      // when
      const columnNames = SceneUtils.columnNamesFrom({ columnNames: ['Column 2', '', 'C'], tableData: tableData });

      // then
      expect(columnNames).toEqual(['Column 2', 'Column 2 (2)', 'C']);
   });

   it('#columnNamesFrom should generate column name when column name contains whitespace only', () => {

      // when
      const columnNames = SceneUtils.columnNamesFrom({ columnNames: ['A', '  ', 'C'], tableData: tableData });

      // then
      expect(columnNames).toEqual(['A', 'Column 2', 'C']);
   });

   it('#columnNamesFrom should return given and generated column names', () => {

      // when
      const columnNames = SceneUtils.columnNamesFrom({ columnNames: ['A', '', 'C'], tableData: tableData });

      // then
      expect(columnNames).toEqual(['A', 'Column 2', 'C']);
   });

   it('#fileContextInfo should return entries with generated keys', () => {

      // when
      const contextInfo = SceneUtils.fileContextInfo(createFile());

      // then
      expect(contextInfo.length).toBe(3);
      expect(contextInfo[0]).toEqual({ name: 'File Name', value: 'test.txt' });
      expect(contextInfo[1]).toEqual({ name: 'File Type', value: 'text/plain' });
      expect(contextInfo[2].name).toEqual('File Modification Time');
   });

   function createFile(): File {
      return new File(['this is the content'], 'test.txt', { type: 'text/plain' });
   }
});
