import { ComponentFixture, TestBed, fakeAsync, flush, discardPeriodicTasks } from '@angular/core/testing';
import { of, Observable } from 'rxjs';
import { GraphComponent } from './graph.component';
import { Column, DataType } from 'app/shared/model';
import { GraphContext } from 'app/shared/model/graph';
import { SimpleChange } from '@angular/core';
import { GraphDataService, RawDataRevealService } from 'app/shared/services';
import { RouterTestingModule } from '@angular/router/testing';
import { SceneFactory } from 'app/shared/test';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';

describe('GraphComponent', () => {

  let columns: Column[];
  let context: GraphContext;
  let entries$: Observable<Object[]>;
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
    entries$ = of([
      { t1: 'a', n1: 1, t2: null },
      { t1: 'b', n1: 2, t2: 'x' },
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ]);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatProgressBarModule, RouterTestingModule, MatDialogModule],
      declarations: [GraphComponent],
      providers: [
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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges should fetch entries when entries$ change', async () => {

    // given
    const entries = ([
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ]);

    // when
    component.entries$ = of(entries);
    component.ngOnChanges({ entries$: new SimpleChange(undefined, entries$, true) });

    // then
    await fixture.whenStable();
    expect(context.entries).toEqual(entries);
  });

  it('ngOnChanges should not fetch entries when entries$ does not change', () => {

    // given
    const entries = context.entries;

    // when
    component.context = new GraphContext(columns);
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });

    // then
    expect(context.entries).toBe(entries);
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
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
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
    component.ngOnChanges({ 'entries$': new SimpleChange(null, null, true) });
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
