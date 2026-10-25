import { ConfigRecord, View, ViewType } from 'app/shared/model/view-config';
import { Route, Scene, StatusType } from '../../model';
import { savedViewOf, SceneFactory } from '../../test';
import { DBService } from '../backend';
import { ViewPersistenceService } from './view-persistence.service';

describe('ViewPersistenceService', () => {

  const NOW = new Date().getTime();
  const A_MINUTE_AGO = NOW - 60_000;
  const AN_HOUR_AGO = NOW - 3_600_000;

  let scene: Scene;
  let dbService: DBService;
  let service: ViewPersistenceService;

  beforeEach(() => {
    scene = SceneFactory.createScene('1', []);
    dbService = new DBService(null, null);
    service = new ViewPersistenceService(dbService);
  });

  it('#findSavedViews should return saved views descending sorted by modified time', () => {

    // given
    const older = savedViewOf('older', [], AN_HOUR_AGO);
    const newer = savedViewOf('newer', [], NOW);
    scene.config = { savedViews: [older, newer] };

    // when
    const views = service.findSavedViews(scene);

    // then
    expect(views).toEqual([newer, older]);
    expect(views[0]).toBe(newer);
  });

  it('#findSavedViews should return no views when scene has none', () => {

    // when
    const views = service.findSavedViews(scene);

    // then
    expect(views).toEqual([]);
  });

  it('#findSavedViews should convert legacy views when saved views are undefined', () => {

    // given
    scene.config = { views: [legacyView('dashboard', NOW)], records: [pivotRecord('pivot', A_MINUTE_AGO)] };

    // when
    const views = service.findSavedViews(scene);

    // then
    expect(views.map(v => v.name)).toEqual(['dashboard', 'pivot']);
    expect(views.map(v => v.tabs[0].type)).toEqual([ViewType.DASHBOARD, ViewType.PIVOT]);
  });

  it('#findSavedViews should convert legacy views and records and remove them from config', () => {

    // given
    const existing = savedViewOf('pivot', [], AN_HOUR_AGO);
    scene.config = { savedViews: [existing], views: [legacyView('dashboard', NOW)], records: [pivotRecord('pivot', A_MINUTE_AGO)] };

    // when
    service.findSavedViews(scene);

    // then
    expect(scene.config.savedViews[0]).toBe(existing);
    expect(scene.config.savedViews.map(v => v.name)).toEqual(['pivot', 'dashboard', 'pivot (2)']);
    expect(scene.config.views).toBeUndefined();
    expect(scene.config.records).toBeUndefined();
  });

  it('#findSavedViews should convert legacy records only', () => {

    // given
    scene.config = { savedViews: [], records: [pivotRecord('pivot', NOW)] };

    // when
    const views = service.findSavedViews(scene);

    // then
    expect(views.map(v => v.name)).toEqual(['pivot']);
    expect(scene.config.records).toBeUndefined();
  });

  it('#findSavedViews should keep already converted views', () => {

    // given
    const a = savedViewOf('a', [], NOW);
    const b = savedViewOf('b', [], A_MINUTE_AGO);
    const savedViews = [a, b];
    scene.config = { savedViews };

    // when
    service.findSavedViews(scene);

    // then
    expect(scene.config.savedViews).toBe(savedViews);
    expect(scene.config.savedViews[0]).toBe(a);
    expect(scene.config.savedViews[1]).toBe(b);
  });

  it('#findSavedViews should not update scene when converting', () => {

    // given
    scene.config = { views: [legacyView('dashboard', NOW)] };
    vi.spyOn(dbService, 'updateScene');

    // when
    service.findSavedViews(scene);

    // then
    expect(dbService.updateScene).not.toHaveBeenCalled();
  });

  it('#saveView should add view and update scene', async () => {

    // given
    const existing = savedViewOf('existing', [], A_MINUTE_AGO);
    scene.config = { savedViews: [existing] };
    const view = savedViewOf('new', [], NOW);
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    const status = await service.saveView(scene, view);

    // then
    expect(status).toEqual({ type: StatusType.SUCCESS, msg: 'View "new" has been saved' });
    expect(scene.config.savedViews).toEqual([existing, view]);
    expect(dbService.updateScene).toHaveBeenCalledWith(scene);
  });

  it('#saveView should replace view with same name', async () => {

    // given
    const other = savedViewOf('other', [], AN_HOUR_AGO);
    scene.config = { savedViews: [savedViewOf('x', [], A_MINUTE_AGO), other] };
    const view = savedViewOf('x', [], NOW);
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    await service.saveView(scene, view);

    // then
    expect(scene.config.savedViews).toEqual([view, other]);
    expect(scene.config.savedViews[0]).toBe(view);
  });

  it('#saveView should persist converted legacy views with saved view', async () => {

    // given
    scene.config = { savedViews: [], views: [legacyView('dashboard', A_MINUTE_AGO)] };
    const view = savedViewOf('new', [], NOW);
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    await service.saveView(scene, view);

    // then
    const persistedScene = vi.mocked(dbService.updateScene).mock.calls[0][0];
    expect(persistedScene.config.savedViews.map(v => v.name)).toEqual(['dashboard', 'new']);
    expect(persistedScene.config.views).toBeUndefined();
  });

  it('#saveView should return error status when update fails with string error', async () => {

    // given
    vi.spyOn(dbService, 'updateScene').mockRejectedValue('Scene cannot be updated');

    // when
    const status = await service.saveView(scene, savedViewOf('test', [], NOW));

    // then
    expect(status).toEqual({ type: StatusType.ERROR, msg: 'View "test" cannot be saved: Scene cannot be updated' });
  });

  it('#updateViews should remove deleted views and update scene', async () => {

    // given
    const kept = savedViewOf('kept', [], NOW);
    const deleted = savedViewOf('deleted', [], NOW);
    scene.config = { savedViews: [kept, deleted] };
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    const status = await service.updateViews(scene, [deleted], []);

    // then
    expect(status).toEqual({ type: StatusType.SUCCESS, msg: 'Deleted 1 view' });
    expect(scene.config.savedViews).toEqual([kept]);
    expect(dbService.updateScene).toHaveBeenCalledWith(scene);
  });

  it('#updateViews should report single deleted and renamed view', async () => {

    // given
    const renamed = savedViewOf('renamed', [], NOW);
    const deleted = savedViewOf('deleted', [], NOW);
    scene.config = { savedViews: [renamed, deleted] };
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    const status = await service.updateViews(scene, [deleted], [{ view: renamed, name: 'new name' }]);

    // then
    expect(status).toEqual({ type: StatusType.SUCCESS, msg: 'Deleted 1 view\nRenamed 1 view' });
    expect(scene.config.savedViews).toEqual([renamed]);
  });

  it('#updateViews should report multiple deleted and renamed views', async () => {

    // given
    const views = [savedViewOf('a', [], NOW), savedViewOf('b', [], NOW), savedViewOf('c', [], NOW), savedViewOf('d', [], NOW)];
    scene.config = { savedViews: [...views] };
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    const status = await service.updateViews(scene, [views[0], views[1]], [{ view: views[2], name: 'x' }, { view: views[3], name: 'y' }]);

    // then
    expect(status).toEqual({ type: StatusType.SUCCESS, msg: 'Deleted 2 views\nRenamed 2 views' });
    expect(scene.config.savedViews).toEqual([views[2], views[3]]);
  });

  it('#updateViews should report renamed views only', async () => {

    // given
    const renamed = savedViewOf('renamed', [], NOW);
    scene.config = { savedViews: [renamed] };
    vi.spyOn(dbService, 'updateScene').mockResolvedValue(scene);

    // when
    const status = await service.updateViews(scene, [], [{ view: renamed, name: 'new name' }]);

    // then
    expect(status).toEqual({ type: StatusType.SUCCESS, msg: 'Renamed 1 view' });
    expect(scene.config.savedViews).toEqual([renamed]);
  });

  it('#updateViews should return error status when update fails with error object', async () => {

    // given
    vi.spyOn(dbService, 'updateScene').mockRejectedValue({ message: 'Scene cannot be updated' });

    // when
    const status = await service.updateViews(scene, [], []);

    // then
    expect(status).toEqual({ type: StatusType.ERROR, msg: 'Views cannot be updated: Scene cannot be updated' });
  });

  it('#saveView should keep saved views when update fails', async () => {

    // given
    const existing = savedViewOf('existing', [], A_MINUTE_AGO);
    const savedViews = [existing];
    scene.config = { savedViews };
    vi.spyOn(dbService, 'updateScene').mockRejectedValue(new Error('offline'));

    // when
    await service.saveView(scene, savedViewOf('new', [], NOW));

    // then
    expect(scene.config.savedViews).toEqual([existing]);
  });

  it('#saveView should keep replaced view when update fails', async () => {

    // given
    const replaced = savedViewOf('x', [], A_MINUTE_AGO);
    scene.config = { savedViews: [replaced] };
    vi.spyOn(dbService, 'updateScene').mockRejectedValue(new Error('offline'));

    // when
    await service.saveView(scene, savedViewOf('x', [], NOW));

    // then
    expect(scene.config.savedViews).toEqual([replaced]);
    expect(scene.config.savedViews[0]).toBe(replaced);
  });

  it('#saveView should keep legacy views when update fails', async () => {

    // given
    const views = [legacyView('dashboard', A_MINUTE_AGO)];
    const records = [pivotRecord('pivot', A_MINUTE_AGO)];
    scene.config = { views, records };
    vi.spyOn(dbService, 'updateScene').mockRejectedValue(new Error('offline'));

    // when
    await service.saveView(scene, savedViewOf('new', [], NOW));

    // then
    expect(scene.config).toEqual({ views, records });
    expect(scene.config.views).toBe(views);
    expect(scene.config.records).toBe(records);
  });

  it('#updateViews should keep deleted views when update fails', async () => {

    // given
    const kept = savedViewOf('kept', [], NOW);
    const deleted = savedViewOf('deleted', [], NOW);
    scene.config = { savedViews: [kept, deleted] };
    vi.spyOn(dbService, 'updateScene').mockRejectedValue(new Error('offline'));

    // when
    const status = await service.updateViews(scene, [deleted], []);

    // then
    expect(status.type).toBe(StatusType.ERROR);
    expect(scene.config.savedViews).toEqual([kept, deleted]);
  });

  it('#updateViews should restore names of renamed views when update fails', async () => {

    // given
    const a = savedViewOf('a', [], NOW);
    const b = savedViewOf('b', [], NOW);
    scene.config = { savedViews: [a, b] };
    vi.spyOn(dbService, 'updateScene').mockRejectedValue(new Error('offline'));

    // when
    await service.updateViews(scene, [], [{ view: a, name: 'x' }, { view: b, name: 'y' }]);

    // then
    expect(scene.config.savedViews.map(v => v.name)).toEqual(['a', 'b']);
  });

  function legacyView(name: string, modifiedTime: number): View {
    return { route: Route.GRID, name, modifiedTime, query: null, gridColumns: 2, gridCellRatio: '1:1', elements: [] };
  }

  function pivotRecord(name: string, modifiedTime: number): ConfigRecord {
    return { route: Route.PIVOT, name, modifiedTime, query: null, data: {} };
  }
});
