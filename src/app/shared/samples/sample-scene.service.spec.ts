import { Scene, SceneInfo } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { CouchDBServiceMock } from 'app/shared/test';
import type { Mock } from 'vitest';
import { fruitSalesSampleOf } from './fruit-sales.sample';
import { SampleSceneService } from './sample-scene.service';

describe('SampleSceneService', () => {

   const sample = fruitSalesSampleOf('en');
   const sampleSceneInfo = { _id: 'sample', name: sample.sceneName, database: 'data_1' } as SceneInfo;
   let dbService: DBService;
   let service: SampleSceneService;
   let persistSceneSpy: Mock;
   let writeEntriesSpy: Mock;
   let saveSceneTabsSpy: Mock;
   let activateSceneSpy: Mock;
   let deleteSceneSpy: Mock;

   beforeEach(() => {
      vi.spyOn(console, 'warn').mockReturnValue(undefined);
      dbService = new DBService(new CouchDBServiceMock());
      service = new SampleSceneService(dbService);
      vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([]);
      vi.spyOn(dbService, 'findFreeDatabaseName').mockResolvedValue('data_7');
      persistSceneSpy = vi.spyOn(dbService, 'persistScene').mockImplementation(async (scene: Scene) => {
         scene._id = 'new';
         return scene;
      });
      writeEntriesSpy = vi.spyOn(dbService, 'writeEntries').mockResolvedValue(undefined);
      saveSceneTabsSpy = vi.spyOn(dbService, 'saveSceneTabs').mockResolvedValue(undefined);
      activateSceneSpy = vi.spyOn(dbService, 'activateScene').mockResolvedValue(undefined);
      deleteSceneSpy = vi.spyOn(dbService, 'deleteScene').mockResolvedValue(undefined);
   });

   it('#open should insert sample scene, entries and tabs before activating it', async () => {

      // when
      await service.open(sample);

      // then
      const scene: Scene = persistSceneSpy.mock.calls[0][0];
      expect(scene.name).toBe(sample.sceneName);
      expect(scene.database).toBe('data_7');
      expect(scene.creationTime).toBeGreaterThan(0);
      expect(persistSceneSpy.mock.calls[0][1]).toBe(false);
      expect(writeEntriesSpy).toHaveBeenCalledTimes(sample.rowCount / SampleSceneService.BATCH_SIZE);
      writeEntriesSpy.mock.calls.forEach(c => expect(c[0]).toBe('data_7'));
      expect(writeEntriesSpy.mock.calls.flatMap(c => c[1]).length).toBe(sample.rowCount);
      expect(writeEntriesSpy.mock.calls[0][1][0][scene.columns[0].name]).toBe(new Date(2024, 0, 1).getTime());
      const sceneTabs = saveSceneTabsSpy.mock.calls[0][0];
      expect(sceneTabs._id).toBe('new_tabs');
      expect(sceneTabs.tabs.length).toBe(2);
      expect(activateSceneSpy).toHaveBeenCalledWith('new');
      expect(activateSceneSpy.mock.invocationCallOrder[0]).toBeGreaterThan(saveSceneTabsSpy.mock.invocationCallOrder[0]);
   });

   it('#open should activate sample scene although tabs cannot be saved', async () => {

      // given
      saveSceneTabsSpy.mockRejectedValue('conflict');

      // when
      await service.open(sample);

      // then
      expect(activateSceneSpy).toHaveBeenCalledWith('new');
      expect(deleteSceneSpy).not.toHaveBeenCalled();
   });

   it('#open should delete sample scene and reject when entries cannot be written', async () => {

      // given
      writeEntriesSpy.mockRejectedValue('disk full');

      // when
      const result = service.open(sample);

      // then
      await expect(result).rejects.toBe('disk full');
      expect(deleteSceneSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: 'new' }));
      expect(activateSceneSpy).not.toHaveBeenCalled();
   });

   it('#open should reject with original error when incomplete scene cannot be deleted', async () => {

      // given
      writeEntriesSpy.mockRejectedValue('disk full');
      deleteSceneSpy.mockRejectedValue('not found');

      // when
      const result = service.open(sample);

      // then
      await expect(result).rejects.toBe('disk full');
   });

   it('#open should reject without persisting when sample file is missing', async () => {

      // given
      vi.spyOn(window, 'fetch').mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

      // when
      const result = service.open(sample);

      // then
      await expect(result).rejects.toThrow('cannot load sample data: Not Found');
      expect(persistSceneSpy).not.toHaveBeenCalled();
   });

   it('#open should activate existing complete sample scene without import', async () => {

      // given
      vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([sampleSceneInfo]);
      vi.spyOn(dbService, 'countEntriesOfActiveScene').mockResolvedValue(sample.rowCount);
      vi.spyOn(window, 'fetch');

      // when
      await service.open(sample);

      // then
      expect(activateSceneSpy).toHaveBeenCalledWith('sample');
      expect(window.fetch).not.toHaveBeenCalled();
      expect(persistSceneSpy).not.toHaveBeenCalled();
   });

   it('#open should not activate existing sample scene again when it is active', async () => {

      // given
      vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([sampleSceneInfo]);
      vi.spyOn(dbService, 'getActiveScene').mockReturnValue(sampleSceneInfo as Scene);
      vi.spyOn(dbService, 'countEntriesOfActiveScene').mockResolvedValue(sample.rowCount);

      // when
      await service.open(sample);

      // then
      expect(activateSceneSpy).not.toHaveBeenCalled();
      expect(persistSceneSpy).not.toHaveBeenCalled();
   });

   it('#open should import sample again when existing sample scene is incomplete', async () => {

      // given
      vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([sampleSceneInfo]);
      vi.spyOn(dbService, 'countEntriesOfActiveScene').mockResolvedValue(500);

      // when
      await service.open(sample);

      // then
      expect(deleteSceneSpy).toHaveBeenCalledWith(sampleSceneInfo);
      expect(persistSceneSpy).toHaveBeenCalled();
      expect(activateSceneSpy).toHaveBeenLastCalledWith('new');
   });

   it('#open should import sample of other language although sample exists in English', async () => {

      // given
      vi.spyOn(dbService, 'findSceneInfos').mockResolvedValue([sampleSceneInfo]);

      // when
      await service.open(fruitSalesSampleOf('de'));

      // then
      const scene: Scene = persistSceneSpy.mock.calls[0][0];
      expect(scene.name).toBe(fruitSalesSampleOf('de').sceneName);
      expect(scene.columns.map(c => c.name)).toEqual(['Datum', 'Region', 'Kanal', 'Produkt', 'Menge', 'Umsatz']);
   });
});
