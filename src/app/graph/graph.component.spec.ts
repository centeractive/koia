import { ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideRouter } from '@angular/router';
import { Column, DataType } from 'app/shared/model';
import { GraphContext } from 'app/shared/model/graph';
import { GraphDataService, RawDataRevealService } from 'app/shared/services';
import { SceneFactory } from 'app/shared/test';
import { CommonUtils } from 'app/shared/utils';
import { D3ForceGraphGenerator } from './d3js/d3-force-graph-generator';
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
    fixture.nativeElement.parentElement.style.width = '600px';
    fixture.nativeElement.parentElement.style.height = '400px';
    component = fixture.componentInstance;
    context = new GraphContext(columns);
    context.entries = entries;
    component.context = context;
    await fixture.whenStable();
    fixture.detectChanges();
    vi.spyOn(component.onWarning, 'emit').mockReturnValue(undefined);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('svg container should leave room for tile header', () => {

    // given
    fixture.nativeElement.style.display = 'block';

    // when
    fixture.nativeElement.style.height = '300px';

    // then
    expect(fixture.nativeElement.querySelector('.div_svg').offsetHeight).toBe(252);
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
    const joc = (expected: object) => expect.objectContaining(expected);
    const root = { index: 0, parent: null, group: 0, name: '', value: '', info: null, count: 4 };
    const child1 = { index: 1, parent: joc(root), group: 1, name: 't1', value: 'a', info: '1', count: 1 };
    const child2 = { index: 2, parent: joc(root), group: 2, name: 't1', value: 'b', info: '3', count: 3 };

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

  it('size change should regenerate graph', fakeAsync(() => {

    // given
    const generate = vi.spyOn(D3ForceGraphGenerator.prototype, 'generate').mockReturnValue(undefined);

    // when
    context.setSize(120, 500);
    flush();

    // then
    expect(generate).toHaveBeenCalledExactlyOnceWith(component.graphData, svgDiv(), context);
  }));

  it('window resize should regenerate graph', fakeAsync(() => {

    // given
    const generate = vi.spyOn(D3ForceGraphGenerator.prototype, 'generate').mockReturnValue(undefined);

    // when
    window.dispatchEvent(new Event('resize'));
    flush();

    // then
    expect(generate).toHaveBeenCalledExactlyOnceWith(component.graphData, svgDiv(), context);
  }));

  it('destroy should stop graph simulation', () => {

    // given
    const stop = vi.spyOn(D3ForceGraphGenerator.prototype, 'stop');

    // when
    fixture.destroy();

    // then
    expect(stop).toHaveBeenCalled();
  });

  it('#ngOnDestroy should stop regenerating graph on context changes', fakeAsync(() => {

    // given
    const sleep = vi.spyOn(CommonUtils, 'sleep');
    const createData = vi.spyOn(graphDataService, 'createData');

    // when
    fixture.destroy();

    // then
    context.setSize(120, 500);
    flush();
    expect(sleep).not.toHaveBeenCalled();
    expect(createData).not.toHaveBeenCalled();
  }));

  it('#ngOnDestroy should not generate graph of context change pending before destroy', fakeAsync(() => {

    // given
    const sleep = vi.spyOn(CommonUtils, 'sleep');
    const createData = vi.spyOn(graphDataService, 'createData');
    context.setSize(120, 500);
    tick();
    expect(sleep).toHaveBeenCalledOnce();

    // when
    fixture.destroy();

    // then
    flush();
    expect(createData).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  }));

  it('should warn user when graph contains too many nodes', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('n1')];
    fixture.detectChanges();
    component.ngOnInit();
    flush();
    vi.spyOn(graphDataService, 'createData').mockReturnValue({ nodes: new Array(GraphComponent.MAX_NODES + 1), links: [] });

    // when
    context.groupByColumns = [findColumn('t1')];
    fixture.detectChanges();
    flush();

    // then
    discardPeriodicTasks();
    const msg = 'Graph: Maximum number of ' + GraphComponent.MAX_NODES.toLocaleString('en-US') + ' nodes exceeded.' +
      '\n\nPlease choose chart instead or apply/refine data filtering.';
    expect(component.onWarning.emit).toHaveBeenCalledWith(msg);
  }));

  it('#createExportData should throw error', () => {
    expect(() => component.createExportData()).toThrow(expect.objectContaining({ message: 'Method not implemented.' }));
  });

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }

  function svgDiv(): HTMLDivElement {
    return fixture.nativeElement.querySelector('.div_svg');
  }
});
