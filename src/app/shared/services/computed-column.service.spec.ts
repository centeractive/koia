import { Aggregation, Column, ComputeOperator, DataType, Route, Scene } from 'app/shared/model';
import { ElementType, SavedView, View, ViewType } from 'app/shared/model/view-config';
import { savedViewOf, SceneFactory } from 'app/shared/test';
import type { Mock } from 'vitest';
import { DBService } from './backend/db.service';
import { ComputedColumnChange, ComputedColumnService } from './computed-column.service';
import { RawDataStateService } from './saved-views/raw-data-state.service';
import { ViewPersistenceService } from './view-persistence/view-persistence.service';
import { ViewTabsService } from './view-tabs/view-tabs.service';

describe('ComputedColumnService', () => {

  let time: Column;
  let level: Column;
  let amount: Column;
  let price: Column;
  let comment: Column;
  let share: Column;
  let scene: Scene;
  let dbService: DBService;
  let updateSceneSpy: Mock;
  let viewTabsService: ViewTabsService;
  let rawDataStateService: RawDataStateService;
  let service: ComputedColumnService;
  let changes: ComputedColumnChange[];

  beforeEach(() => {
    time = { name: 'Time', dataType: DataType.TIME, width: 100, indexed: true };
    level = { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true };
    amount = { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true };
    price = { name: 'Price', dataType: DataType.NUMBER, width: 50, indexed: true };
    comment = { name: 'Comment', dataType: DataType.NUMBER, width: 80, indexed: false };
    share = computedColumn('Share', ComputeOperator.PERCENTAGE);
    scene = SceneFactory.createScene('1', [time, level, amount, price, comment, share]);
    dbService = new DBService(null);
    vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    updateSceneSpy = vi.spyOn(dbService, 'updateScene').mockImplementation(s => Promise.resolve(s));
    viewTabsService = { renameColumn: vi.fn() } as unknown as ViewTabsService;
    rawDataStateService = new RawDataStateService(dbService);
    vi.spyOn(rawDataStateService, 'renameColumn');
    service = new ComputedColumnService(dbService, viewTabsService, new ViewPersistenceService(dbService), rawDataStateService);
    changes = [];
    service.changed$.subscribe(c => changes.push(c));
  });

  it('#columns should return computed columns', () => {

    // when
    const columns = service.columns();

    // then
    expect(columns).toEqual([share]);
  });

  it('#operandColumns should return indexed number columns that are not computed', () => {

    // when
    const columns = service.operandColumns();

    // then
    expect(columns).toEqual([amount, price]);
  });

  it('#usedNames should return names of all columns and reserved names', () => {

    // when
    const names = service.usedNames();

    // then
    expect(names).toEqual(['Time', 'Level', 'Amount', 'Price', 'Comment', 'Share', '_id', '_rev', 'fgcolor', 'bgcolor']);
  });

  it('#usedNames should not return name of excepted computed column', () => {

    // when
    const names = service.usedNames('Share');

    // then
    expect(names).toEqual(['Time', 'Level', 'Amount', 'Price', 'Comment', '_id', '_rev', 'fgcolor', 'bgcolor']);
  });

  it('#usedNames should return name of excepted stored column', () => {

    // when
    const names = service.usedNames('Amount');

    // then
    expect(names).toContain('Amount');
  });

  it('#save should append new column and emit change', async () => {

    // given
    const sum = computedColumn('Sum', ComputeOperator.ADD);

    // when
    await service.save(sum);

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, share, sum]);
    expect(updateSceneSpy).toHaveBeenCalledWith(scene);
    expect(changes).toEqual([{ name: 'Sum', previousName: 'Sum' }]);
    expect(viewTabsService.renameColumn).not.toHaveBeenCalled();
  });

  it('#save should replace existing column', async () => {

    // given
    const edited = computedColumn('Share', ComputeOperator.DIVIDE);

    // when
    await service.save(edited, 'Share');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, edited]);
    expect(changes).toEqual([{ name: 'Share', previousName: 'Share' }]);
    expect(viewTabsService.renameColumn).not.toHaveBeenCalled();
  });

  it('#save should rename column, saved views and tabs in place and emit previous name', async () => {

    // given
    const view = viewOf('Share');
    const savedView = savedViewWith(view, { Share: 40 });
    scene.config = { savedViews: [savedView] };
    const renamed = computedColumn('Ratio', ComputeOperator.PERCENTAGE);

    // when
    await service.save(renamed, 'Share');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, renamed]);
    expect(scene.config.savedViews[0]).toBe(savedView);
    expect(savedView.tabs[0].view).toBe(view);
    expect(view.elements[0].dataColumns[0].name).toBe('Ratio');
    expect(savedView.rawData.data.columnWidths).toEqual({ Ratio: 40 });
    expect(viewTabsService.renameColumn).toHaveBeenCalledWith('Share', 'Ratio');
    expect(changes).toEqual([{ name: 'Ratio', previousName: 'Share' }]);
  });

  it('#save should convert legacy views and rename column in converted saved view', async () => {

    // given
    scene.config = { views: [viewOf('Share')] };

    // when
    await service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    expect(scene.config.views).toBeUndefined();
    expect(scene.config.savedViews[0].tabs[0].view.elements[0].dataColumns[0].name).toBe('Ratio');
  });

  it('#save should rename column width of pending raw data state when column was renamed', async () => {

    // given
    const state = savedViewWith(viewOf('Share'), { Share: 40 }).rawData;
    rawDataStateService.apply(state);

    // when
    await service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    expect(state.data.columnWidths).toEqual({ Ratio: 40 });
  });

  it.each(['Amount', 'Comment', '_id', 'fgcolor'])('#save should reject name "%s" without updating scene', async name => {

    // given
    const column = computedColumn(name, ComputeOperator.ADD);

    // when
    const save = service.save(column, 'Share');

    // then
    await expect(save).rejects.toThrow('column name "' + name + '" is already in use');
    expect(updateSceneSpy).not.toHaveBeenCalled();
    expect(scene.columns).toEqual([time, level, amount, price, comment, share]);
    expect(changes).toEqual([]);
  });

  it('#save should reject name of other computed column without updating scene', async () => {

    // given
    const sum = computedColumn('Sum', ComputeOperator.ADD);
    scene.columns.push(sum);

    // when
    const save = service.save(computedColumn('Share', ComputeOperator.ADD), 'Sum');

    // then
    await expect(save).rejects.toThrow('column name "Share" is already in use');
    expect(updateSceneSpy).not.toHaveBeenCalled();
  });

  it('#save should reject replacing stored column without updating scene', async () => {

    // when
    const save = service.save(computedColumn('Ratio', ComputeOperator.ADD), 'Amount');

    // then
    await expect(save).rejects.toThrow('column "Amount" is not a computed column');
    expect(updateSceneSpy).not.toHaveBeenCalled();
  });

  it('#save should restore columns, undo rename and not emit when scene cannot be updated', async () => {

    // given
    const view = viewOf('Share');
    const savedView = savedViewWith(view, { Share: 40 });
    scene.config = { savedViews: [savedView] };
    const columns = scene.columns;
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const save = service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    await expect(save).rejects.toThrow('offline');
    expect(scene.columns).toBe(columns);
    expect(view.elements[0].dataColumns[0].name).toBe('Share');
    expect(savedView.rawData.data.columnWidths).toEqual({ Share: 40 });
    expect(viewTabsService.renameColumn).not.toHaveBeenCalled();
    expect(rawDataStateService.renameColumn).not.toHaveBeenCalled();
    expect(changes).toEqual([]);
  });

  it('#save should keep new name in saved view that already referenced it when scene cannot be updated', async () => {

    // given
    const view = viewOf('Ratio');
    const savedView = savedViewWith(view, { Share: 40, Ratio: 30 });
    scene.config = { savedViews: [savedView] };
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const save = service.save(computedColumn('Ratio', ComputeOperator.PERCENTAGE), 'Share');

    // then
    await expect(save).rejects.toThrow('offline');
    expect(view.elements[0].dataColumns[0].name).toBe('Ratio');
    expect(savedView.rawData.data.columnWidths).toEqual({ Share: 40, Ratio: 30 });
  });

  it('#remove should remove computed column and emit change', async () => {

    // when
    await service.remove('Share');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment]);
    expect(updateSceneSpy).toHaveBeenCalledWith(scene);
    expect(viewTabsService.renameColumn).not.toHaveBeenCalled();
    expect(changes).toEqual([{ name: undefined, previousName: 'Share' }]);
  });

  it('#remove should keep stored column of same name', async () => {

    // when
    await service.remove('Amount');

    // then
    expect(scene.columns).toEqual([time, level, amount, price, comment, share]);
  });

  it('#remove should restore columns and not emit when scene cannot be updated', async () => {

    // given
    const columns = scene.columns;
    updateSceneSpy.mockRejectedValue(new Error('offline'));

    // when
    const remove = service.remove('Share');

    // then
    await expect(remove).rejects.toThrow('offline');
    expect(scene.columns).toBe(columns);
    expect(scene.columns).toEqual([time, level, amount, price, comment, share]);
    expect(changes).toEqual([]);
  });

  function computedColumn(name: string, operator: ComputeOperator): Column {
    return { name, dataType: DataType.NUMBER, width: 70, indexed: false, computation: { leftColumn: 'Amount', operator, rightColumn: 'Price' } };
  }

  function viewOf(dataColumnName: string): View {
    return {
      route: Route.GRID, name: 'View', modifiedTime: 1, query: undefined, gridColumns: 2, gridCellRatio: '1:1',
      elements: [{
        elementType: ElementType.SUMMARY, title: 'Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 300, height: 300,
        dataColumns: [{ name: dataColumnName, dataType: DataType.NUMBER, width: 70 }], splitColumns: [], groupByColumns: [],
        aggregations: [Aggregation.AVG], valueGroupings: [], colorOptions: undefined
      }]
    };
  }

  function savedViewWith(view: View, columnWidths: Record<string, number>): SavedView {
    const savedView = savedViewOf('all', [{ id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard', view }]);
    savedView.rawData.data.columnWidths = columnWidths;
    return savedView;
  }
});
