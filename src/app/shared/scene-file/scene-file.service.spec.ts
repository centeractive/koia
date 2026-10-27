import { DataType, Document, Scene, SceneInfo } from 'app/shared/model';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ExportService } from 'app/shared/services/export/export.service';
import { CouchDBServiceMock } from 'app/shared/test';
import type { Mock } from 'vitest';
import { SCENE_FILE_FORMAT, SCENE_FILE_VERSION, SceneFile } from './scene-file';
import { SceneFileCodec } from './scene-file-codec';
import { SceneFileService } from './scene-file.service';
import { SceneInserter } from './scene-inserter.service';

describe('SceneFileService', () => {

   const tabs: TabDef[] = [{ id: 'tab1', type: ViewType.PIVOT, title: 'Pivot' }];
   let dbService: DBService;
   let exportService: ExportService;
   let sceneInserter: SceneInserter;
   let service: SceneFileService;
   let saveBlobAsSpy: Mock;
   let insertSpy: Mock;
   let findSceneInfosSpy: Mock;

   beforeEach(() => {
      dbService = new DBService(new CouchDBServiceMock(), null);
      exportService = new ExportService();
      sceneInserter = new SceneInserter(dbService);
      service = new SceneFileService(dbService, exportService, sceneInserter);
      saveBlobAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
      insertSpy = vi.spyOn(sceneInserter, 'insert').mockResolvedValue(undefined);
      findSceneInfosSpy = vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([{ name: 'Sales' } as SceneInfo]);
      vi.spyOn(dbService, 'getMaxDataItemsPerScene').mockReturnValue(10);
   });

   function scene(): Scene {
      return {
         creationTime: 1, name: 'Sales', shortDescription: '', database: 'data_1', columnMappings: [],
         columns: [{ name: 'Amount', dataType: DataType.NUMBER, width: 10 }], config: { savedViews: [] }
      };
   }

   function sceneFileOf(entries: object[]): SceneFile {
      return { format: SCENE_FILE_FORMAT, version: SCENE_FILE_VERSION, scene: scene(), tabs, entries };
   }

   async function fileOf(sceneFile: SceneFile): Promise<File> {
      return new File([await SceneFileCodec.encode(sceneFile)], 'sales.koia');
   }

   function givenStoredScene(sceneTabs: TabDef[] | undefined): void {
      vi.spyOn(dbService, 'findScene').mockResolvedValue({ ...scene(), _id: 's1', _rev: '1-a' });
      vi.spyOn(dbService, 'findAllEntries').mockResolvedValue([{ _id: '1', _rev: '1-b', Amount: 1 } as Document]);
      vi.spyOn(dbService, 'findSceneTabs').mockResolvedValue(sceneTabs ? { _id: 's1_tabs', _rev: '1-c', tabs: sceneTabs } : undefined);
   }

   it('#export should save gzipped scene file without ids named after scene', async () => {

      // given
      givenStoredScene(tabs);

      // when
      await service.export('s1');

      // then
      const [blob, fileName] = saveBlobAsSpy.mock.calls[0];
      expect(await SceneFileCodec.decode(blob)).toEqual(sceneFileOf([{ Amount: 1 }]));
      expect(fileName).toMatch(/^Sales_\d{4}-\d{2}-\d{2}_\d{6}\.koia$/);
      expect(dbService.findAllEntries).toHaveBeenCalledWith('data_1');
      expect(dbService.findSceneTabs).toHaveBeenCalledWith('s1');
   });

   it('#export should save no tabs when scene has no open tabs', async () => {

      // given
      givenStoredScene(undefined);

      // when
      await service.export('s1');

      // then
      const sceneFile = await SceneFileCodec.decode(saveBlobAsSpy.mock.calls[0][0]) as SceneFile;
      expect(sceneFile.tabs).toEqual([]);
   });

   it('#import should insert scene of file with entries numbered in file order, its tabs and abort signal', async () => {

      // given
      const file = await fileOf(sceneFileOf([{ Amount: 1 }, { Amount: 2 }]));
      const signal = new AbortController().signal;

      // when
      await service.import(file, signal);

      // then
      expect(insertSpy).toHaveBeenCalledWith(scene(), new Set(['Sales']), [{ Amount: 1, _id: '1000001' }, { Amount: 2, _id: '1000002' }], tabs,
         signal);
   });

   it('#import should reject file that is no scene file', async () => {

      // when
      const result = service.import(new File(['a,b\n1,2'], 'orders.csv'));

      // then
      await expect(result).rejects.toBe('orders.csv is not a Koia scene file');
      expect(insertSpy).not.toHaveBeenCalled();
   });

   it('#import should reject invalid scene file', async () => {

      // given
      const file = await fileOf({ ...sceneFileOf([]), format: 'other' } as unknown as SceneFile);

      // when
      const result = service.import(file);

      // then
      await expect(result).rejects.toMatch(/^scene file is invalid:/);
      expect(insertSpy).not.toHaveBeenCalled();
   });

   it('#import should reject file with more entries than storage holds', async () => {

      // given
      vi.spyOn(dbService, 'getMaxDataItemsPerScene').mockReturnValue(1);
      const file = await fileOf(sceneFileOf([{ Amount: 1 }, { Amount: 2 }]));

      // when
      const result = service.import(file);

      // then
      await expect(result).rejects.toBe('scene has 2 rows, the current storage holds at most 1 rows per scene');
      expect(findSceneInfosSpy).not.toHaveBeenCalled();
      expect(insertSpy).not.toHaveBeenCalled();
   });

   it('#import should accept as many entries as storage holds', async () => {

      // given
      vi.spyOn(dbService, 'getMaxDataItemsPerScene').mockReturnValue(2);
      const file = await fileOf(sceneFileOf([{ Amount: 1 }, { Amount: 2 }]));

      // when
      await service.import(file);

      // then
      expect(insertSpy).toHaveBeenCalled();
   });
});
