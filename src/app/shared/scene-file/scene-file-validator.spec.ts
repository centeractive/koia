import { DataType } from 'app/shared/model';
import { ViewType } from 'app/shared/model/view-config';
import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { SampleData, SampleDef, toEntries } from 'app/shared/samples/sample-data';
import { savedViewOf } from 'app/shared/test/saved-view-factory';
import { SCENE_FILE_FORMAT, SCENE_FILE_VERSION, SceneFile } from './scene-file';
import { SceneFileValidator } from './scene-file-validator';

describe('SceneFileValidator', () => {

   const validator = new SceneFileValidator();

   function validFile(): SceneFile {
      return {
         format: SCENE_FILE_FORMAT,
         version: SCENE_FILE_VERSION,
         scene: {
            creationTime: 1, name: 'Sales', shortDescription: '', database: 'data_1', columnMappings: [],
            columns: [{ name: 'Amount', dataType: DataType.NUMBER, width: 10 }], config: { savedViews: [savedViewOf('All')] }
         },
         tabs: [{ id: 'tab1', type: ViewType.PIVOT, title: 'Pivot' }],
         entries: [{ Amount: 1 }, { Amount: 2 }]
      };
   }

   async function sampleFileOf(def: SampleDef): Promise<SceneFile> {
      const response = await fetch('/assets/samples/' + def.file);
      const data: SampleData = await response.json();
      return {
         format: SCENE_FILE_FORMAT,
         version: SCENE_FILE_VERSION,
         scene: { ...data.scene, creationTime: 1, database: 'data_1' },
         tabs: data.tabs,
         entries: toEntries(data)
      };
   }

   it('should accept valid scene file', () => {

      // when
      const rejection = validator.rejectionOf(validFile());

      // then
      expect(rejection).toBeUndefined();
   });

   it.each([['fruit sales', fruitSalesSampleOf('en')], ['app logs', appLogsSampleOf('en')]])('should accept file of %s sample scene', async (_, def) => {

      // given
      const sceneFile = await sampleFileOf(def);

      // when
      const rejection = validator.rejectionOf(sceneFile);

      // then
      expect(rejection).toBeUndefined();
   });

   it.each<[string, (file: SceneFile) => unknown, string]>([
      ['content that is no object', () => [], '/'],
      ['other format', f => ({ ...f, format: 'other' }), '/format'],
      ['other version', f => ({ ...f, version: 2 }), '/version'],
      ['missing tabs', f => ({ ...f, tabs: undefined }), '/'],
      ['scene with _id', f => ({ ...f, scene: { ...f.scene, _id: 'x' } }), '/scene/_id'],
      ['scene with _rev', f => ({ ...f, scene: { ...f.scene, _rev: '1-a' } }), '/scene/_rev'],
      ['tab of unknown type', f => ({ ...f, tabs: [{ ...f.tabs[0], type: 'graph' }] }), '/tabs/0/type'],
      ['tab without title', f => ({ ...f, tabs: [{ id: 'tab1', type: ViewType.PIVOT }] }), '/tabs/0'],
      ['saved view without raw data', f => ({ ...f, scene: { ...f.scene, config: { savedViews: [{ name: 'All', modifiedTime: 1, tabs: [] }] } } }),
         '/scene/config/savedViews/0'],
      ['saved view with invalid tab', f => ({ ...f, scene: { ...f.scene, config: { savedViews: [{ ...savedViewOf('All'), tabs: [{ id: 1, type: ViewType.PIVOT, title: 'x' }] }] } } }),
         '/scene/config/savedViews/0/tabs/0/id'],
      ['entry that is no object', f => ({ ...f, entries: [1] }), '/entries/0'],
      ['entry with _id', f => ({ ...f, entries: [{ _id: '1', Amount: 1 }] }), '/entries/0'],
      ['entry with object value', f => ({ ...f, entries: [{ Amount: 1 }, { x: {} }] }), '/entries/1/x']
   ])('should reject %s', (_, mutation, path) => {

      // when
      const rejection = validator.rejectionOf(mutation(validFile()));

      // then
      expect(rejection.startsWith('scene file is invalid:\n' + path + ': ')).toBe(true);
   });

   it('should reject scene violating scene format although unversioned', () => {

      // given
      const sceneFile = validFile();
      sceneFile.scene.columns = [];

      // when
      const rejection = validator.rejectionOf(sceneFile);

      // then
      expect(rejection.startsWith('scene does not comply with scene format 1.0:\n/columns: ')).toBe(true);
   });

   it('should reject scene of unsupported format version', () => {

      // given
      const sceneFile = validFile();
      sceneFile.scene.schemaVersion = '9.9';

      // when
      const rejection = validator.rejectionOf(sceneFile);

      // then
      expect(rejection).toBe('scene format 9.9 is not supported by this Koia version (supported: 1.0)');
   });
});
