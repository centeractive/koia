import { NgZone, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { provideRouter, Router } from '@angular/router';
import { ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { ChangeEvent, Column, DataType, Route, Scene } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { RawDataRevealService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService, defaultMargin } from 'app/shared/services/chart';
import { LanguageService } from 'app/shared/services/language';
import { TabsPersister } from 'app/shared/services/view-tabs/tabs-persister';
import { SceneFactory } from 'app/shared/test';
import { CommonUtils } from 'app/shared/utils';
import { ChartComponent } from './chart.component';
import type { Mock } from 'vitest';

describe('ChartComponent', () => {

  let scene: Scene;
  let context: ChartContext;
  let entries: object[];
  const dbService = new DBService(null);
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;
  let getActiveSceneSpy: Mock;

  beforeAll(() => {
    scene = SceneFactory.createScene('1', []);
    entries = [
      { t1: 'a', n1: 1, t2: null },
      { t1: 'b', n1: 2, t2: 'x' },
      { t1: 'b', n1: 3, t2: 'y' },
      { t1: 'b', n1: 2, t2: 'x' }
    ];
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [ChartComponent],
      imports: [MatProgressBarModule, MatDialogModule, ResizableDirective, ResizeHandleDirective],
      providers: [
        provideRouter([]),
        { provide: DBService, useValue: dbService },
        { provide: ChartDataService, useClass: ChartDataService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: RawDataRevealService, useClass: RawDataRevealService }
      ]
    })
    fixture = TestBed.createComponent(ChartComponent);
    fixture.nativeElement.parentElement.style.width = '600px';
    fixture.nativeElement.parentElement.style.height = '400px';
    component = fixture.componentInstance;
    context = new ChartContext([], ChartType.PIE.type, defaultMargin());
    context.entries = entries;
    component.context = context;
    getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('chart container should leave room for tile header', () => {

    // given
    fixture.nativeElement.style.display = 'block';

    // when
    fixture.nativeElement.style.height = '300px';

    // then
    expect(fixture.nativeElement.querySelector('.div_chartjs').offsetHeight).toBe(252);
  });

  it('#ngOnInit should navigate to scenes view when no scene is active', fakeAsync(() => {

    // given
    getActiveSceneSpy.mockReturnValue(null);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);

    // when
    component.ngOnInit();
    flush();

    // then
    expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  }));

  it('should compute chart data when context changes', fakeAsync(() => {

    // given
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    fixture.detectChanges();
    component.ngOnChanges({ 'entries': new SimpleChange(null, null, true) });
    flush();

    // when
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();

    // then
    expect(context.data.labels).toEqual(['1', '2', '3']);
    expect(context.data.datasets.length).toBe(1);
    expect(context.data.datasets[0].data).toEqual([1, 2, 1]);
    expect(context.chart).toBeTruthy();
  }));

  it('should emit warning when context changes but new chart data cannot be obtained', fakeAsync(() => {

    // given
    vi.spyOn(TestBed.inject(ChartDataService), 'createData').mockReturnValue({ error: 'server not available' });
    vi.spyOn(component.onWarning, 'emit').mockReturnValue(undefined);
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    fixture.detectChanges();
    component.ngOnChanges({ 'entries': new SimpleChange(null, null, true) });
    flush();

    // when
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();

    // then
    expect(component.onWarning.emit).toHaveBeenCalledWith('server not available');
  }));

  it('#ngOnDestroy should destroy chart', fakeAsync(() => {

    // given
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    context.groupByColumns = [createColumn('t1', DataType.TEXT)];
    fixture.detectChanges();
    flush();
    const chart = context.chart;
    vi.spyOn(chart, 'destroy');

    // when
    fixture.destroy();

    // then
    expect(chart.destroy).toHaveBeenCalled();
  }));

  it('#ngOnDestroy should not fail when no chart exists', () => {

    // given
    context.chart = undefined;

    // when
    const destroy = () => fixture.destroy();

    // then
    expect(destroy).not.toThrow();
  });

  it('#ngOnDestroy should stop refreshing on context changes', fakeAsync(() => {

    // given
    const sleep = vi.spyOn(CommonUtils, 'sleep');
    const createData = vi.spyOn(TestBed.inject(ChartDataService), 'createData');

    // when
    fixture.destroy();

    // then
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];
    flush();
    expect(sleep).not.toHaveBeenCalled();
    expect(createData).not.toHaveBeenCalled();
  }));

  it('#ngOnDestroy should not fail when no scene is active', () => {

    // given
    getActiveSceneSpy.mockReturnValue(null);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(undefined);
    const noSceneFixture = TestBed.createComponent(ChartComponent);
    noSceneFixture.componentInstance.context = context;
    noSceneFixture.detectChanges();

    // when
    const destroy = () => noSceneFixture.destroy();

    // then
    expect(destroy).not.toThrow();
  });

  it('should not create chart when destroyed before pending context change is processed', fakeAsync(() => {

    // given
    context.chart = undefined;
    context.dataColumns = [createColumn('n1', DataType.NUMBER)];

    // when
    fixture.destroy();
    flush();

    // then
    expect(context.chart).toBeUndefined();
    expect(component.loading).toBe(false);
  }));

  it('#validateElementResize should return true when margin is valid', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 100, width: 100 },
      edges: { top: 1 }
    }
    component.ngOnChanges({ 'context': new SimpleChange(null, null, true) });

    // when
    const validation = component.validateMarginResize(resizeEvent);

    // then
    expect(validation).toBe(true);
  });

  it('#validateElementResize should return false when margin is invalid', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 100, width: 100 },
      edges: { top: -1 }
    }
    component.ngOnChanges({ 'context': new SimpleChange(null, null, true) });

    // when
    const validation = component.validateMarginResize(resizeEvent);

    // then
    expect(validation).toBe(false);
  });

  it('#onResizeEnd should define margin when resized at top left corner', fakeAsync(() => {

    // given
    context.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    flush();
    const resizeEvent = {
      rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
      edges: { top: 1, left: 2 }
    }

    // when
    component.onMarginResizeEnd(resizeEvent);

    // then
    flush();
    expect(context.margin).toEqual({ top: 1, bottom: 0, left: 2, right: 0 });
    const cmpElement = component.cmpElementRef.nativeElement;
    const top = 1 + cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    expect(component.marginDivStyle).toEqual({ top: top + 'px', right: '0px', bottom: '0px', left: '2px' });
  }));

  it('#onResizeEnd should define margin when resized at bottom right corner', fakeAsync(() => {

    // given
    context.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    flush();
    const resizeEvent = {
      rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
      edges: { right: -1, bottom: -2 }
    };

    // when
    component.onMarginResizeEnd(resizeEvent);

    // then
    flush();
    expect(context.margin).toEqual({ top: 0, right: 1, bottom: 2, left: 0 });
    const cmpElement = component.cmpElementRef.nativeElement;
    const top = cmpElement.getBoundingClientRect().top - cmpElement.parentElement.parentElement.getBoundingClientRect().top;
    expect(component.marginDivStyle).toEqual({ top: top + 'px', right: '1px', bottom: '2px', left: '0px' });
  }));

  it('should show dashed border of ghost element when resizing margin', () => {

    // given
    showResizableMargin();
    const handle = fixture.nativeElement.querySelector('.resize-handle-top');

    // when
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }));

    // then
    const ghost = fixture.nativeElement.querySelector('.resize-ghost-element');
    expect(getComputedStyle(ghost).borderTopStyle).toBe('dashed');
  });

  it('should not propagate mousedown from margin resize handle to host', () => {

    // given
    showResizableMargin();
    const hostListener = vi.fn();
    fixture.nativeElement.addEventListener('mousedown', hostListener);
    const handle = fixture.nativeElement.querySelector('.resize-handle-top');

    // when
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));

    // then
    expect(hostListener).not.toHaveBeenCalled();
  });

  it('should not propagate touchstart from resizable margin to host', () => {

    // given
    showResizableMargin();
    const hostListener = vi.fn();
    fixture.nativeElement.addEventListener('touchstart', hostListener);
    const marginDiv = fixture.nativeElement.querySelector('.div_margins');

    // when
    marginDiv.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

    // then
    expect(hostListener).not.toHaveBeenCalled();
  });

  it('should position resize ghost of margin relative to its container', () => {

    // when
    showResizableMargin();

    // then
    const resizable = fixture.debugElement.query(By.directive(ResizableDirective)).injector.get(ResizableDirective);
    expect(resizable.ghostElementPositioning).toBe('absolute');
  });

  describe('resizable margin on pointer press', () => {

    let tile: HTMLDivElement;
    let ownMarginButton: HTMLButtonElement;
    let otherTile: HTMLDivElement;

    beforeEach(() => {
      tile = document.createElement('div');
      document.body.appendChild(tile);
      tile.appendChild(fixture.nativeElement);
      ownMarginButton = createMarginButton(tile);
      otherTile = document.createElement('div');
      document.body.appendChild(otherTile);
      createMarginButton(otherTile);
      showResizableMargin();
    });

    afterEach(() => {
      tile.remove();
      otherTile.remove();
    });

    function createMarginButton(parent: HTMLElement): HTMLButtonElement {
      const button = document.createElement('button');
      button.classList.add('but_element_margin');
      button.appendChild(document.createElement('span'));
      parent.appendChild(button);
      return button;
    }

    function pressPointerOn(element: Element): void {
      element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
    }

    function expectMarginShown(shown: boolean): void {
      expect(context.isShowResizableMargin()).toBe(shown);
      expect(!!fixture.nativeElement.querySelector('.div_margins')).toBe(shown);
    }

    it('should hide margin when pointer is pressed on chart canvas', () => {

      // when
      pressPointerOn(fixture.nativeElement.querySelector('canvas'));

      // then
      expectMarginShown(false);
    });

    it('should hide margin when pointer is pressed inside margin area', () => {

      // when
      pressPointerOn(fixture.nativeElement.querySelector('.div_margins'));

      // then
      expectMarginShown(false);
    });

    it('should hide margin when pointer is pressed on margin button of other tile', () => {

      // when
      pressPointerOn(otherTile.querySelector('.but_element_margin'));

      // then
      expectMarginShown(false);
    });

    it.each(['top', 'left', 'right', 'bottom'])('should keep margin when pointer is pressed on %s margin resize handle', edge => {

      // when
      pressPointerOn(fixture.nativeElement.querySelector('.resize-handle-' + edge));

      // then
      expectMarginShown(true);
    });

    it('should keep margin when pointer is pressed on own margin button', () => {

      // when
      pressPointerOn(ownMarginButton.querySelector('span'));

      // then
      expectMarginShown(true);
    });

    it('should keep margin hidden when pointer is pressed while margin is hidden', () => {

      // given
      context.toggleShowResizableMargin();
      fixture.detectChanges();

      // when
      pressPointerOn(fixture.nativeElement.querySelector('canvas'));

      // then
      expectMarginShown(false);
    });

    it('should not hide margin when pointer is pressed after chart is destroyed', () => {

      // given
      fixture.destroy();

      // when
      tile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      // then
      expect(context.isShowResizableMargin()).toBe(true);
    });

    it('should hide margin inside Angular zone', () => {

      // given
      vi.spyOn(TestBed.inject(NgZone), 'run').mockReturnValue(undefined);

      // when
      fixture.nativeElement.querySelector('canvas').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      // then
      expect(context.isShowResizableMargin()).toBe(true);
    });

    it.each([
      { edge: 'top', point: (r: DOMRect) => [r.left + r.width / 2, r.top] },
      { edge: 'bottom', point: (r: DOMRect) => [r.left + r.width / 2, r.bottom - 1] },
      { edge: 'left', point: (r: DOMRect) => [r.left, r.top + r.height / 2] },
      { edge: 'right', point: (r: DOMRect) => [r.right - 1, r.top + r.height / 2] }
    ])('should cover $edge border line of margin with resize handle', ({ edge, point }) => {

      // given
      component.marginDivStyle = { top: '20px', right: '20px', bottom: '20px', left: '20px' };
      fixture.detectChanges();
      const [x, y] = point(fixture.nativeElement.querySelector('.div_margins').getBoundingClientRect());

      // when
      const element = document.elementFromPoint(x, y);

      // then
      expect(element.classList).toContain('resize-handle-' + edge);
    });
  });

  describe('language change', () => {

    let languageService: LanguageService;

    beforeEach(() => {
      languageService = TestBed.inject(LanguageService);
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
    });

    afterEach(() => document.documentElement.lang = 'en');

    function createCountBarChart(): void {
      context.chartType = ChartType.BAR.type;
      context.dataColumns = [createColumn('t1', DataType.TEXT)];
      fixture.detectChanges();
      flush();
    }

    function valueScaleTitle(): string {
      return context.chart.options.scales['y']['title'].text;
    }

    it('should re-create chart with texts of new language', fakeAsync(() => {

      // given
      createCountBarChart();
      const chart = context.chart;
      expect(valueScaleTitle()).toBe('Count');

      // when
      languageService.use('de');
      flush();

      // then
      expect(context.chart).not.toBe(chart);
      expect(valueScaleTitle()).toBe('Anzahl');
    }));

    it('should neither change context nor persist anything', fakeAsync(() => {

      // given
      createCountBarChart();
      const changeEvents: ChangeEvent[] = [];
      context.subscribeToChanges((e: ChangeEvent) => changeEvents.push(e));
      const dbWrites = (['persistScene', 'updateScene', 'saveSceneTabs', 'writeEntries'] as const)
        .map(m => vi.spyOn(dbService, m).mockResolvedValue(undefined));

      // when
      languageService.use('de');
      flush();
      languageService.use('ja');
      tick(TabsPersister.DELAY_MS + 1);
      flush();

      // then
      expect(changeEvents).toEqual([]);
      dbWrites.forEach(spy => expect(spy).not.toHaveBeenCalled());
    }));

    it('should re-create invisible chart not before it is visible again', fakeAsync(() => {

      // given
      createCountBarChart();
      const chart = context.chart;
      fixture.nativeElement.style.display = 'none';

      // when
      languageService.use('ja');
      fixture.detectChanges();
      flush();

      // then
      expect(context.chart).toBe(chart);

      // when
      fixture.nativeElement.style.display = 'block';
      fixture.detectChanges();
      flush();

      // then
      expect(context.chart).not.toBe(chart);
      expect(valueScaleTitle()).toBe('件数');
    }));

    it('should not create chart that did not exist before', fakeAsync(() => {

      // given
      context.chart = undefined;

      // when
      languageService.use('de');
      fixture.detectChanges();
      flush();

      // then
      expect(context.chart).toBeUndefined();
    }));
  });

  it('#createExportData should throw error', () => {
    expect(() => component.createExportData()).toThrow(expect.objectContaining({ message: 'Method not implemented.' }));
  });

  function showResizableMargin(): void {
    component.marginDivStyle = {};
    context.toggleShowResizableMargin();
    fixture.detectChanges();
  }

  function createColumn(name: string, dataType: DataType): Column {
    return {
      name: name,
      dataType: dataType,
      width: 10
    };
  }
});
