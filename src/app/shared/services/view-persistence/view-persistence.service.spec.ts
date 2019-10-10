import { Route, Aggregation, StatusType, Scene, DataType, Column } from '../../model';
import { Chart } from '../view-persistence/chart.type';
import { ViewPersistenceService } from './view-persistence.service';
import { DBService } from '../backend';
import { DocChangeResponse } from '../backend/doc-change-response.type';
import { SceneFactory } from '../../test';
import { Summary } from './summary.type';
import { ConfigRecord } from '../../model/view-config/config-record.type';
import { View, ElementType, ViewElement } from 'app/shared/model/view-config';

describe('ViewPersistenceService', () => {

  const NOW = new Date().getTime();
  const A_MINUTE_AGO = NOW - 60_000;

  let pivotTableRecord: ConfigRecord;
  let summary: Summary;
  let chart: Chart;
  let gridView: View;
  let scene: Scene;
  let dbService: DBService;
  let updateSceneOK: DocChangeResponse;
  let service: ViewPersistenceService;

  beforeAll(() => {
    const amountColum = createColumn('Amount', DataType.NUMBER);
    const levelColumn = createColumn('Level', DataType.TEXT);
    const timeColumn = createColumn('Time', DataType.TIME);
    summary = {
      elementType: ElementType.SUMMARY, title: 'Test Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 600, height: 600,
      dataColumns: [amountColum], splitColumns: [levelColumn], groupByColumns: [timeColumn], aggregations: [Aggregation.COUNT], 
      valueGroupings: [], empty: ''
    };
    chart = {
      elementType: ElementType.CHART, title: 'Test Chart', gridColumnSpan: 2, gridRowSpan: 1, width: 600, height: 600,
      dataColumns: [amountColum], splitColumns: [levelColumn], groupByColumns: [timeColumn], aggregations: [Aggregation.COUNT], 
      valueGroupings: [], chartType: 'lineChart', margin: { top: 1, right: 2, bottom: 3, left: 4 }, showLegend: true,
      legendPosition: 'top', xLabelRotation: -12, stacked: false
    };
  });

  beforeEach(() => {
    scene = SceneFactory.createScene('1', []);
    pivotTableRecord = { route: Route.PIVOT, name: 'pivot', modifiedTime: NOW, data: { a: 1, b: 2, c: 3 } };
    gridView = createGridView('grid', A_MINUTE_AGO, chart);
    scene.config = { records: [pivotTableRecord], views: [gridView] };
    updateSceneOK = { ok: true, id: scene._id, rev: scene._rev };
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

  it('#saveRecord should insert record when no one with same name exists', () => {

    // given
    const data = { x: 'one', y: 'two' };
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, 'new', data);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View "new" has been saved' }));
    const recordNames = service.findRecords(scene, Route.PIVOT).map(r => r.name);
    expect(recordNames).toEqual(['new', pivotTableRecord.name]);
  });

  it('#saveRecord should update record when record with same name exists', () => {

    // given
    const data = { x: 'one', y: 'two' };
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, pivotTableRecord.name, data);

    // then
    const expectedMsg = 'View "' + pivotTableRecord.name + '" has been saved';
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: expectedMsg }));
    const records = service.findRecords(scene, Route.PIVOT);
    expect(records.length).toBe(1);
    expect(records[0].route).toBe(Route.PIVOT);
    expect(records[0].name).toBe(pivotTableRecord.name);
    expect(records[0].data).toBe(data);
    expect(records[0].modifiedTime).toBeGreaterThan(NOW);
  });

  it('#saveRecord should return error status when server returns error message', () => {

    // given
    spyOn(dbService, 'updateScene').and.returnValue(Promise.reject('Scene cannot be updated'));

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, 'test', {});

    // then
    const expectedMsg = 'View "test" cannot be saved: Scene cannot be updated';
    status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: expectedMsg }));
  });

  it('#saveRecord should return error status when server returns error object', () => {

    // given
    spyOn(dbService, 'updateScene').and.returnValue(Promise.reject({ message: 'Scene cannot be updated' }));

    // when
    const status$ = service.saveRecord(scene, Route.PIVOT, 'test', {});

    // then
    const expectedMsg = 'View "test" cannot be saved: Scene cannot be updated';
    status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: expectedMsg }));
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

  it('#saveView should add view when no one with same route exists', () => {

    // given
    const flexView = createFlexView('flex', NOW, summary);
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = service.saveView(scene, flexView);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View "flex" has been saved' }));
    expect(service.findViews(scene, Route.FLEX)).toEqual([flexView]);
    expect(service.findViews(scene, Route.GRID)).toEqual([gridView]);
  });

  it('#saveView should add view when no one with same name exists', () => {

    // given
    const newGridView = createGridView('new', NOW, summary);
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = service.saveView(scene, newGridView);

    // then
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: 'View "new" has been saved' }));
    expect(service.findViews(scene, Route.GRID)).toEqual([newGridView, gridView]);
    expect(service.findViews(scene, Route.FLEX)).toEqual([]);
  });

  it('#saveView should update view when view with same name exists', () => {

    // given
    const newGridView = createGridView(gridView.name, NOW, summary);
    spyOn(dbService, 'updateScene').and.returnValue(Promise.resolve(updateSceneOK));

    // when
    const status$ = service.saveView(scene, newGridView);

    // then
    const expectedMsg = 'View "' + gridView.name + '" has been saved';
    status$.then(s => expect(s).toEqual({ type: StatusType.SUCCESS, msg: expectedMsg }));
    expect(service.findViews(scene, Route.GRID)).toEqual([newGridView]);
    expect(service.findViews(scene, Route.FLEX)).toEqual([]);
  });

  it('#saveView should return error status when server returns error', () => {

    // given
    spyOn(dbService, 'updateScene').and.returnValue(Promise.reject('Scene cannot be updated'));

    // when
    const status$ = service.saveView(scene, gridView);

    // then
    const expectedMsg = 'View "' + gridView.name + '" cannot be saved: Scene cannot be updated';
    status$.then(s => expect(s).toEqual({ type: StatusType.ERROR, msg: expectedMsg }));
  });

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }

  function createFlexView(name: string, modifiedTime: number, element: ViewElement): View {
    return { route: Route.FLEX, name: name, modifiedTime: modifiedTime, gridColumns: null, gridCellRatio: null, elements: [element] };
  }

  function createGridView(name: string, modifiedTime: number, element: ViewElement): View {
    return { route: Route.GRID, name: name, modifiedTime: modifiedTime, gridColumns: 3, gridCellRatio: '1:1', elements: [element] };
  }
});


