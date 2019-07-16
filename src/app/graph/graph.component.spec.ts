import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatProgressBarModule, MatDialogModule } from '@angular/material';
import { of, Observable } from 'rxjs';
import { GraphComponent } from './graph.component';
import { GraphContext, Column, GraphNode, DataType, Scene } from 'app/shared/model';
import { NvD3Module } from 'ng2-nvd3';
import { SimpleChange } from '@angular/core';
import { GraphDataService, RawDataRevealService } from 'app/shared/services';
import { RouterTestingModule } from '@angular/router/testing';
import 'nvd3';
import { DBService } from 'app/shared/services/backend';

describe('GraphComponent', () => {

  let columns: Column[];
  let scene: Scene;
  let context: GraphContext;
  let entries$: Observable<Object[]>;
  const dbService = new DBService(null);
  let component: GraphComponent;
  let fixture: ComponentFixture<GraphComponent>;
  const graphDataService = new GraphDataService();

  beforeAll(() => {
    columns = [
      { name: 't1', dataType: DataType.TEXT, width: 200 },
      { name: 'n1', dataType: DataType.NUMBER, width: 50 },
      { name: 't2', dataType: DataType.TEXT, width: 300 }
    ]
    scene = createScene('1');
    entries$ = of([
      { t1: 'a', n1: 1, t2: null },
      { t1: 'b', n1: 2, t2: 'x' },
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ]);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatProgressBarModule, NvD3Module, RouterTestingModule, MatDialogModule],
      declarations: [GraphComponent],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: GraphDataService, useValue: graphDataService },
        { provide: RawDataRevealService, useClass: RawDataRevealService }
      ]
    })
    fixture = TestBed.createComponent(GraphComponent);
    component = fixture.componentInstance;
    context = new GraphContext(columns);
    component.context = context;
    component.entries$ = entries$;
    spyOn(component.onWarning, 'emit');
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute graph data when structure changes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();

    // when
    context.groupByColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();

    // then
    const root: GraphNode = { parent: null, group: 0, name: '', value: '', info: null };
    const child1: GraphNode = { parent: root, group: 1, name: 't1', value: 'a', info: '1' };
    const child2: GraphNode = { parent: root, group: 2, name: 't1', value: 'b', info: '3' };
    const expected = {
      nodes: [root, child1, child2],
      links: [
        { source: root, target: child1 },
        { source: root, target: child2 }
      ]
    };
    expect(component.graphData).toEqual(expected);
  }));

  it('should create graph options when size changes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();

    // when
    context.setSize(120, 500)
    fixture.detectChanges();
    flush();

    // then
    expect(component.graphOptions['chart'].width).toEqual(120);
    expect(component.graphOptions['chart'].height).toEqual(500);
  }));

  it('should warn user when graph contains too many nodes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
    flush();
    spyOn(graphDataService, 'createData').and.returnValue({ nodes: new Array(GraphComponent.MAX_NODES + 1), links: [] });

    // when
    context.groupByColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();

    // then
    const msg = 'Graph: Maximum number of ' + GraphComponent.MAX_NODES + ' nodes exceeded.' +
      '\n\nPlease choose chart instead or apply/refine data filtering.';
    expect(component.onWarning.emit).toHaveBeenCalledWith(msg);
  }));

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }

  function createScene(id: string): Scene {
    return {
      _id: id,
      creationTime: new Date().getTime(),
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      columns: columns,
      database: 'test_data_' + id,
      config: {
        records: [],
        views: []
      }
    };
  }
});
