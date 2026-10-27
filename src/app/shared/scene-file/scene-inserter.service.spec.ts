import { DataType, Document, Scene } from 'app/shared/model';
import { TabDef, ViewType } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { CouchDBServiceMock } from 'app/shared/test';
import type { Mock } from 'vitest';
import { SceneInserter } from './scene-inserter.service';

describe('SceneInserter', () => {

   const tabs: TabDef[] = [{ id: 'tab1', type: ViewType.PIVOT, title: 'Pivot' }];
   let dbService: DBService;
   let inserter: SceneInserter;
   let persistSceneSpy: Mock;
   let writeEntriesSpy: Mock;
   let saveSceneTabsSpy: Mock;
   let activateSceneSpy: Mock;
   let deleteSceneSpy: Mock;

   beforeEach(() => {
      vi.spyOn(console, 'warn').mockReturnValue(undefined);
      dbService = new DBService(new CouchDBServiceMock(), null);
      inserter = new SceneInserter(dbService);
      vi.spyOn(dbService, 'findFreeDatabaseName').mockResolvedValue('data_7');
      persistSceneSpy = vi.spyOn(dbService, 'persistScene').mockImplementation(async (scene: Scene) => {
         scene._id ??= 'gen';
         scene._rev = '1';
         return scene;
      });
      writeEntriesSpy = vi.spyOn(dbService, 'writeEntries').mockResolvedValue(undefined);
      saveSceneTabsSpy = vi.spyOn(dbService, 'saveSceneTabs').mockResolvedValue(undefined);
      activateSceneSpy = vi.spyOn(dbService, 'activateScene').mockResolvedValue(undefined);
      deleteSceneSpy = vi.spyOn(dbService, 'deleteScene').mockResolvedValue(undefined);
   });

   function contentOf(id?: string): Omit<Scene, '_rev' | 'creationTime' | 'database'> {
      return {
         ...(id ? { _id: id } : {}),
         name: 'Sales',
         shortDescription: 'sales of 2024',
         columnMappings: [],
         columns: [{ name: 'Amount', dataType: DataType.NUMBER, width: 10 }],
         config: { savedViews: [] }
      };
   }

   function entries(count: number): Document[] {
      return Array.from({ length: count }, (_, i) => ({ Amount: i }) as Document);
   }

   it('should insert scene named uniquely into free database, its entries in batches and tabs before activating it', async () => {

      // when
      await inserter.insert(contentOf('x'), new Set(['Sales']), entries(2_500), tabs);

      // then
      const scene: Scene = persistSceneSpy.mock.calls[0][0];
      expect(scene._id).toBe('x');
      expect(scene.name).toBe('Sales (2)');
      expect(persistSceneSpy.mock.calls[0][1]).toBe(false);
      expect(writeEntriesSpy.mock.calls.map(c => c[0])).toEqual(['data_7', 'data_7', 'data_7']);
      expect(writeEntriesSpy.mock.calls.map(c => c[1].length)).toEqual([1_000, 1_000, 500]);
      expect(saveSceneTabsSpy).toHaveBeenCalledWith({ _id: 'x_tabs', tabs });
      expect(activateSceneSpy).toHaveBeenCalledWith('x');
      expect(activateSceneSpy.mock.invocationCallOrder[0]).toBeGreaterThan(saveSceneTabsSpy.mock.invocationCallOrder[0]);
   });

   it('should use generated id when content has none', async () => {

      // when
      await inserter.insert(contentOf(), new Set(), entries(1), tabs);

      // then
      expect(saveSceneTabsSpy).toHaveBeenCalledWith({ _id: 'gen_tabs', tabs });
      expect(activateSceneSpy).toHaveBeenCalledWith('gen');
   });

   it('should replace creation time and database of content', async () => {

      // given
      const content = { ...contentOf('x'), creationTime: 1, database: 'other' };

      // when
      await inserter.insert(content, new Set(), entries(1), tabs);

      // then
      const scene: Scene = persistSceneSpy.mock.calls[0][0];
      expect(scene.creationTime).toBeGreaterThan(1);
      expect(scene.database).toBe('data_7');
   });

   it('should activate scene although tabs cannot be saved', async () => {

      // given
      saveSceneTabsSpy.mockRejectedValue('conflict');

      // when
      await inserter.insert(contentOf('x'), new Set(), entries(1), tabs);

      // then
      expect(activateSceneSpy).toHaveBeenCalledWith('x');
      expect(deleteSceneSpy).not.toHaveBeenCalled();
   });

   it('should delete scene and reject when entries cannot be written', async () => {

      // given
      writeEntriesSpy.mockRejectedValue('disk full');

      // when
      const result = inserter.insert(contentOf('x'), new Set(), entries(1), tabs);

      // then
      await expect(result).rejects.toBe('disk full');
      expect(deleteSceneSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: 'x' }));
      expect(activateSceneSpy).not.toHaveBeenCalled();
   });

   it('should not delete scene and reject when scene cannot be persisted', async () => {

      // given
      persistSceneSpy.mockRejectedValue('conflict');

      // when
      const result = inserter.insert(contentOf('x'), new Set(), entries(1), tabs);

      // then
      await expect(result).rejects.toBe('conflict');
      expect(deleteSceneSpy).not.toHaveBeenCalled();
   });

   it('should delete scene and reject when aborted while entries are written', async () => {

      // given
      const controller = new AbortController();
      writeEntriesSpy.mockImplementation(async () => controller.abort());

      // when
      const result = inserter.insert(contentOf('x'), new Set(), entries(2_500), tabs, controller.signal);

      // then
      await expect(result).rejects.toHaveProperty('name', 'AbortError');
      expect(writeEntriesSpy).toHaveBeenCalledTimes(1);
      expect(deleteSceneSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: 'x' }));
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
      expect(activateSceneSpy).not.toHaveBeenCalled();
   });

   it('should delete scene and reject when aborted while last entries are written', async () => {

      // given
      const controller = new AbortController();
      writeEntriesSpy.mockImplementation(async () => controller.abort());

      // when
      const result = inserter.insert(contentOf('x'), new Set(), entries(500), tabs, controller.signal);

      // then
      await expect(result).rejects.toHaveProperty('name', 'AbortError');
      expect(deleteSceneSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: 'x' }));
      expect(saveSceneTabsSpy).not.toHaveBeenCalled();
      expect(activateSceneSpy).not.toHaveBeenCalled();
   });

   it('should reject with original error when incomplete scene cannot be deleted', async () => {

      // given
      writeEntriesSpy.mockRejectedValue('disk full');
      deleteSceneSpy.mockRejectedValue('not found');

      // when
      const result = inserter.insert(contentOf('x'), new Set(), entries(1), tabs);

      // then
      await expect(result).rejects.toBe('disk full');
   });
});
