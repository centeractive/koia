import { CategoricalColorScheme, ColorSchemeType } from 'app/shared/color';
import { ElementType, View, ViewElement } from 'app/shared/model/view-config';
import { Aggregation, Column, DataType, Query, Route, Scene, StatusType } from '../../model';
import { ConfigRecord } from '../../model/view-config/config-record.type';
import { SceneFactory } from '../../test';
import { DBService } from '../backend';
import { Chart } from '../view-persistence/chart.type';
import { Summary } from './summary.type';
import { ViewPersistenceService } from './view-persistence.service';

describe('ViewPersistenceService', () => {

  const NOW = new Date().getTime();
  const A_MINUTE_AGO = NOW - 60_000;

  let pivotTableRecord: ConfigRecord;
  let summary: Summary;
  let chart: Chart;
  let gridView: View;
  let scene: Scene;
  let dbService: DBService;
  let service: ViewPersistenceService;

  beforeAll(() => {
    const amountColum = createColumn('Amount', DataType.NUMBER);
    const levelColumn = createColumn('Level', DataType.TEXT);
    const timeColumn = createColumn('Time', DataType.TIME);
    summary = {
      elementType: ElementType.SUMMARY, title: 'Test Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 600, height: 600,
      dataColumns: [amountColum], splitColumns: [levelColumn], groupByColumns: [timeColumn], aggregations: [Aggregation.COUNT],
      valueGroupings: [], empty: '', colorOptions: undefined
    };
    chart = {
      elementType: ElementType.CHART, title: 'Test Chart', gridColumnSpan: 2, gridRowSpan: 1, width: 600, height: 600,
      dataColumns: [amountColum], splitColumns: [levelColumn], groupByColumns: [timeColumn], aggregations: [Aggregation.COUNT],
      valueGroupings: [], chartType: 'lineChart', margin: { top: 1, right: 2, bottom: 3, left: 4 }, showLegend: true,
      legendPosition: 'top', xLabelStepSize: undefined, xLabelRotation: -12, yLabelStepSize: 1, yLabelRotation: -90, stacked: false,
      colorOptions: {
        type: ColorSchemeType.CATEGORICAL,
        scheme: CategoricalColorScheme.PAIRED,
        bgColorOpacity: 0.7,
        borderColorOpacity: 1
      }
    };
  });

  beforeEach(() => {
    scene = SceneFactory.createScene('1', []);
    pivotTableRecord = {
      route: Route.PIVOT,
      name: 'pivot',
      modifiedTime: NOW,
      query: null,
      data: { a: 1, b: 2, c: 3 }
    };
    gridView = createGridView('grid', A_MINUTE_AGO, chart);
    scene.config = {
      records: [pivotTableRecord],
      views: [gridView]
    };
    dbService = new DBService(null);
    service = new ViewPersistenceService(dbService);
  });

  it('#findRecords should return empty array when no matching records exists', () => {

    // when
    const records = service.findRecords(scene, Route.RAWDATA);

    // then
    expect(records).toEqual([]);
  });

  it('#findRecords should return record when matching record exists', () => {

    // when
    const records = service.findRecords(scene, Route.PIVOT);

    // then
    expect(records).toEqual([pivotTableRecord]);
  });

  it('#saveRecord should insert record when no one with same name exists', async () => {

    // given
    const data = { x: 'one', y: 'two' };
    spyOn(dbService, 'updateScene').and.resolveTo(scene);

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, 'new', new Query(), data);

    // then
    await status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View "new" has been saved' }));
    const recordNames = service.findRecords(scene, Route.PIVOT).map(r => r.name);
    expect(recordNames).toEqual(['new', pivotTableRecord.name]);
  });

  it('#saveRecord should update record when record with same name exists', async () => {

    // given
    const data = { x: 'one', y: 'two' };
    spyOn(dbService, 'updateScene').and.resolveTo(scene);

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, pivotTableRecord.name, new Query(), data);

    // then
    const expectedMsg = 'View "' + pivotTableRecord.name + '" has been saved';
    await status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: expectedMsg }));
    const records = service.findRecords(scene, Route.PIVOT);
    expect(records.length).toBe(1);
    expect(records[0].route).toBe(Route.PIVOT);
    expect(records[0].name).toBe(pivotTableRecord.name);
    expect(records[0].data).toBe(data);
    expect(records[0].modifiedTime).toBeGreaterThan(NOW);
  });

  it('#saveRecord should return error status when server returns error message', async () => {

    // given
    spyOn(dbService, 'updateScene').and.rejectWith('Scene cannot be updated');

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, 'test', new Query(), {});

    // then
    const expectedMsg = 'View "test" cannot be saved: Scene cannot be updated';
    await status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: expectedMsg }));
  });

  it('#saveRecord should return error status when server returns error object', async () => {

    // given
    spyOn(dbService, 'updateScene').and.rejectWith({ message: 'Scene cannot be updated' });

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, 'test', new Query(), {});

    // then
    const expectedMsg = 'View "test" cannot be saved: Scene cannot be updated';
    await status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: expectedMsg }));
  });

  it('#findViews should return empty array when no matching view exists', () => {

    // when
    const views = service.findViews(scene, Route.RAWDATA);

    // then
    expect(views).toEqual([]);
  });

  it('#findViews should return view when matching view exists', () => {

    // when
    const views = service.findViews(scene, Route.GRID);

    // then
    expect(views).toEqual([gridView]);
  });

  it('#saveView should add view when none with same route exists', async () => {

    // given
    const flexView = createFlexView('flex', NOW, summary);
    spyOn(dbService, 'updateScene').and.resolveTo(scene);

    // when
    const status$ = service.saveView(scene, flexView);

    // then
    await status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View "flex" has been saved' }));
    expect(service.findViews(scene, Route.FLEX)).toEqual([flexView]);
    expect(service.findViews(scene, Route.GRID)).toEqual([gridView]);
  });

  it('#saveView should add view when none with same name exists', async () => {

    // given
    const newGridView = createGridView('new', NOW, summary);
    spyOn(dbService, 'updateScene').and.resolveTo(scene);

    // when
    const status$ = service.saveView(scene, newGridView);

    // then
    await status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View "new" has been saved' }));
    expect(service.findViews(scene, Route.GRID)).toEqual([newGridView, gridView]);
    expect(service.findViews(scene, Route.FLEX)).toEqual([]);
  });

  it('#saveView should update view when view with same name exists', async () => {

    // given
    const newGridView = createGridView(gridView.name, NOW, summary);
    spyOn(dbService, 'updateScene').and.resolveTo(scene);

    // when
    const status$ = service.saveView(scene, newGridView);

    // then
    const expectedMsg = 'View "' + gridView.name + '" has been saved';
    await status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: expectedMsg }));
    expect(service.findViews(scene, Route.GRID)).toEqual([newGridView]);
    expect(service.findViews(scene, Route.FLEX)).toEqual([]);
  });

  it('#saveView should return error status when server returns error', async () => {

    // given
    spyOn(dbService, 'updateScene').and.rejectWith('Scene cannot be updated');

    // when
    const status$ = service.saveView(scene, gridView);

    // then
    const expectedMsg = 'View "' + gridView.name + '" cannot be saved: Scene cannot be updated';
    await status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: expectedMsg }));
  });

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }

  function createFlexView(name: string, modifiedTime: number, element: ViewElement): View {
    return {
      route: Route.FLEX,
      name,
      modifiedTime,
      query: null,
      gridColumns: null,
      gridCellRatio: null,
      elements: [element]
    };
  }

  function createGridView(name: string, modifiedTime: number, element: ViewElement): View {
    return {
      route: Route.GRID,
      name,
      modifiedTime,
      query: null,
      gridColumns: 3,
      gridCellRatio: '1:1',
      elements: [element]
    };
  }

});


