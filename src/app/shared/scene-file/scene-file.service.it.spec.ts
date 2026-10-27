import { provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Document, Route, Scene } from 'app/shared/model';
import { ConfigRecord, TabDef, View, ViewType } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ExportService } from 'app/shared/services/export/export.service';
import { BACKENDS, BackendRun, IT_PROVIDERS, sceneData, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { savedViewOf } from 'app/shared/test/saved-view-factory';
import { SceneFileService } from './scene-file.service';
import { SceneInserter } from './scene-inserter.service';

const TIMEOUT = 30_000;

describe.each(BACKENDS)('Scene file IT ($name)', backend => {

   const tabs: TabDef[] = [
      { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot', record: { route: Route.PIVOT, name: 'Pivot', modifiedTime: 1, query: {}, data: {} } as ConfigRecord },
      { id: 'tab2', type: ViewType.DASHBOARD, title: 'Dashboard', view: { route: Route.GRID, name: 'Dashboard', modifiedTime: 1, query: {}, elements: [] } as View }
   ];
   let run: BackendRun;
   let scene: Scene;
   let exportService: ExportService;
   let service: SceneFileService;
   let exported: Blob;

   beforeEach(async () => {
      TestBed.configureTestingModule({ providers: [provideZoneChangeDetection(), ...IT_PROVIDERS] });
      const data = sceneData('it', 2_500);
      data.scene.config.savedViews = [savedViewOf('x')];
      run = await setUpBackend(backend, [data]);
      scene = run.scenes[0].scene;
      await run.db.saveSceneTabs({ _id: DBService.sceneTabsId(scene._id), tabs });
      exportService = new ExportService();
      vi.spyOn(exportService, 'saveBlobAs').mockImplementation(blob => exported = blob);
      vi.spyOn(console, 'log').mockReturnValue(undefined);
      service = new SceneFileService(run.db, exportService, new SceneInserter(run.db));
   }, TIMEOUT);

   afterEach(async () => {
      await tearDownBackend(run);
   }, TIMEOUT);

   function withoutIds(docs: Document[]): object[] {
      return docs.map(d => {
         const copy = { ...d };
         delete copy._id;
         delete copy._rev;
         return copy;
      });
   }

   async function importedScene(): Promise<Scene> {
      const sceneInfo = (await run.db.findSceneInfos()).find(si => si._id !== scene._id);
      const imported = await run.db.findScene(sceneInfo._id);
      run.scenes.push({ scene: imported, entries: [] });
      return imported;
   }

   it('export, delete and import should restore scene with identical rows, saved views and tabs', async () => {

      // given
      const originalEntries = await run.db.findAllEntries(scene.database);
      await service.export(scene._id);
      await run.db.deleteScene(scene);

      // when
      await service.import(new File([exported], 'it.koia'));

      // then
      expect(originalEntries).toHaveLength(2_500);
      expect(await run.db.findSceneInfos()).toHaveLength(1);
      const imported = await importedScene();
      expect(imported._id).not.toBe(scene._id);
      expect(imported.name).toBe(scene.name);
      expect(imported.columns).toEqual(scene.columns);
      expect(imported.config).toEqual(scene.config);
      expect((await run.db.findSceneTabs(imported._id)).tabs).toEqual(tabs);
      expect(withoutIds(await run.db.findAllEntries(imported.database))).toEqual(withoutIds(originalEntries));
      expect(run.db.getActiveScene()._id).toBe(imported._id);
   }, TIMEOUT);

   it('import should name scene uniquely when scene of same name exists', async () => {

      // given
      await service.export(scene._id);

      // when
      await service.import(new File([exported], 'it.koia'));

      // then
      expect((await importedScene()).name).toBe(scene.name + ' (2)');
   }, TIMEOUT);
});
