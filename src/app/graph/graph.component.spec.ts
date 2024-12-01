import { ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideRouter } from '@angular/router';
import { Column, DataType } from 'app/shared/model';
import { GraphContext } from 'app/shared/model/graph';
import { GraphDataService, RawDataRevealService } from 'app/shared/services';
import { SceneFactory } from 'app/shared/test';
import { GraphComponent } from './graph.component';

describe('GraphComponent', () => {

  let columns: Column[];
  let context: GraphContext;
  let entries: object[];
  let component: GraphComponent;
  let fixture: ComponentFixture<GraphComponent>;
  const graphDataService = new GraphDataService();

  beforeAll(() => {
    columns = [
      { name: 't1', dataType: DataType.TEXT, width: 200 },
      { name: 'n1', dataType: DataType.NUMBER, width: 50 },
      { name: 't2', dataType: DataType.TEXT, width: 300 }
    ]
    SceneFactory.createScene('1', []);
    entries = [
      { t1: 'a', n1: 1, t2: null },
      { t1: 'b', n1: 2, t2: 'x' },
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ];
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MatProgressBarModule, MatDialogModule],
      declarations: [GraphComponent],
      providers: [
        provideRouter([]),
        { provide: GraphDataService, useValue: graphDataService },
        { provide: RawDataRevealService, useClass: RawDataRevealService }
      ]
    })
    fixture = TestBed.createComponent(GraphComponent);
    component = fixture.componentInstance;
    context = new GraphContext(columns);
    context.entries = entries;
    component.context = context;
    await fixture.whenStable();
    fixture.detectChanges();
    spyOn(component.onWarning, 'emit');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('context entries change should refresh graph data', fakeAsync(() => {

    // given
    const graphData = component.graphData;
    const entries = [
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ];

    // when
    context.entries = entries;

    // then
    flush();
    discardPeriodicTasks()
    expect(component.graphData).not.toBe(graphData);
  }));

  it('should compute graph data when structure changes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    flush();

    // when
    context.groupByColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();

    // then    
    discardPeriodicTasks();
    const joc = jasmine.objectContaining;
    const root = { index: 0, parent: null, group: 0, name: '', value: '', info: null };
    const child1 = { index: 1, parent: joc(root), group: 1, name: 't1', value: 'a', info: '1' };
    const child2 = { index: 2, parent: joc(root), group: 2, name: 't1', value: 'b', info: '3' };

    expect(component.graphData.nodes.length).toBe(3);
    expect(component.graphData.nodes[0]).toEqual(joc(root));
    expect(component.graphData.nodes[1]).toEqual(joc(child1));
    expect(component.graphData.nodes[2]).toEqual(joc(child2));

    expect(component.graphData.links.length).toBe(2);
    expect(component.graphData.links[0].source.index).toBe(root.index);
    expect(component.graphData.links[0].target.index).toBe(child1.index);
    expect(component.graphData.links[1].source.index).toBe(root.index);
    expect(component.graphData.links[1].target.index).toBe(child2.index);
  }));

  it('should create graph options when size changes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    flush();

    // when
    context.setSize(120, 500)
    fixture.detectChanges();
    flush();

    // then
    expect(component.graphOptions['chart'].width).toEqual(120);
    expect(component.graphOptions['chart'].height).toEqual(500);

    discardPeriodicTasks();
  }));

  it('should warn user when graph contains too many nodes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    flush();
    spyOn(graphDataService, 'createData').and.returnValue({ nodes: new Array(GraphComponent.MAX_NODES + 1), links: [] });

    // when
    context.groupByColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();

    // then
    discardPeriodicTasks();
    const msg = 'Graph: Maximum number of ' + GraphComponent.MAX_NODES.toLocaleString() + ' nodes exceeded.' +
      '\n\nPlease choose chart instead or apply/refine data filtering.';
    expect(component.onWarning.emit).toHaveBeenCalledWith(msg);
  }));

  it('#createExportData should throw error', () => {
    expect(() => component.createExportData()).toThrowError('Method not implemented.');
  });

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }
});
