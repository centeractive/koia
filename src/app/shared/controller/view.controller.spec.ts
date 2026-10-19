import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Directive, ElementRef, QueryList } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ElementContext, SummaryContext, TextBoxContext } from '../model';
import { ChartContext, ChartType } from '../model/chart';
import { GraphContext } from '../model/graph';
import { ChartMarginService } from '../services/chart';
import { SceneFactory } from '../test';
import { ViewController } from './view.controller';

@Directive()
class ViewControllerTestable extends ViewController {

   readonly addedContexts: ElementContext[] = [];

   constructor() {
      super(null, null, null, null, null, null, null, null, null, null);
   }

   generateDashboard(): void { }

   protected onPreRestoreView(): void { }

   protected onPreSaveView(): void { }

   protected onElementContextAdded(context: ElementContext): void {
      this.addedContexts.push(context);
   }
}

describe('ViewController', () => {

   let viewController: ViewControllerTestable;

   beforeAll(() => {
      const sidenav = {
         mode: null,
         open: () => null
      };
      viewController = new ViewControllerTestable();
      viewController.sidenav = sidenav as MatSidenav;
   });

   it('#views should be empty when scene is undefined', () => {
      expect(viewController.views).toEqual([]);
   });

   it('#isShowResizableMargin should return false when not chart context', () => {

      // when
      const result = viewController.isShowResizableMargin(new GraphContext([]));

      // then
      expect(result).toBe(false);
   });

   it('#isShowResizableMargin should return <undefined> when chart context but not showing margin', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });

      // when
      const result = viewController.isShowResizableMargin(chartContext);

      // then
      expect(result).toBeUndefined();
   });

   it('#isShowResizableMargin should return true when chart context and showing margin', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      chartContext.toggleShowResizableMargin();

      // when
      const result = viewController.isShowResizableMargin(chartContext);

      // then
      expect(result).toBe(true);
   });

   it('#configure should open sidenav in "push" mode when element is far left', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      viewController.elementContexts = [chartContext];
      vi.spyOn(viewController.sidenav, 'open').mockReturnValue(undefined);

      // when
      viewController.configure({ clientX: ViewController.SIDENAV_WIDTH - 1 } as MouseEvent, chartContext);

      // then
      expect(viewController.sidenav.mode).toBe('push');
      expect(viewController.sidenav.open).toHaveBeenCalled();
   });

   it('#configure should open sidenav in "over" mode when element is not far left', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      viewController.elementContexts = [chartContext];
      vi.spyOn(viewController.sidenav, 'open').mockReturnValue(undefined);

      // when
      viewController.configure({ clientX: ViewController.SIDENAV_WIDTH + 1 } as MouseEvent, chartContext);

      // then
      expect(viewController.sidenav.mode).toBe('over');
      expect(viewController.sidenav.open).toHaveBeenCalled();
   });

   it('#configure should open sidenav in "over" mode when x-position is missing in mouse event', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      viewController.elementContexts = [chartContext];
      vi.spyOn(viewController.sidenav, 'open').mockReturnValue(undefined);

      // when
      viewController.configure({} as MouseEvent, chartContext);

      // then
      expect(viewController.sidenav.mode).toBe('over');
      expect(viewController.sidenav.open).toHaveBeenCalled();
   });

   it('#ngAfterViewInit should not select view when scene is undefined', () => {

      // given
      const controller = new ViewControllerTestable();
      vi.spyOn(controller, 'selectView').mockReturnValue(undefined);

      // when
      controller.ngAfterViewInit();

      // then
      expect(controller.selectView).not.toHaveBeenCalled();
   });

   it('#ngAfterViewInit should not scroll when element containers changed to none', () => {

      // given
      const controller = new ViewControllerTestable();
      controller['scene'] = SceneFactory.createScene('1', []);
      const div = document.createElement('div');
      vi.spyOn(div, 'scrollIntoView').mockReturnValue(undefined);
      controller.elementContainerDivRefs = new QueryList<ElementRef<HTMLDivElement>>();
      controller.elementContainerDivRefs.reset([new ElementRef(div)]);
      controller.ngAfterViewInit();

      // when
      controller.elementContainerDivRefs.reset([]);
      controller.elementContainerDivRefs.notifyOnChanges();

      // then
      expect(div.scrollIntoView).not.toHaveBeenCalled();
   });

   it('#ngAfterViewInit should scroll last element container into view only once when added element flag is set', () => {

      // given
      const div = document.createElement('div');
      vi.spyOn(div, 'scrollIntoView').mockReturnValue(undefined);
      const controller = controllerWithContainers(div);
      controller['scrollToAddedElement'] = true;

      // when
      controller.elementContainerDivRefs.notifyOnChanges();
      controller.elementContainerDivRefs.notifyOnChanges();

      // then
      expect(div.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'end' });
   });

   it('#ngAfterViewInit should scroll text tile into view when added', () => {

      // given
      const div = document.createElement('div');
      vi.spyOn(div, 'scrollIntoView').mockReturnValue(undefined);
      const controller = controllerWithContainers(div);
      controller['columns'] = [];

      // when
      controller.addTextTile();
      controller.elementContainerDivRefs.notifyOnChanges();

      // then
      expect(div.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'end' });
   });

   it('#ngAfterViewInit should not scroll when note was added', () => {

      // given
      const div = document.createElement('div');
      vi.spyOn(div, 'scrollIntoView').mockReturnValue(undefined);
      const controller = controllerWithContainers(div);
      controller['columns'] = [];

      // when
      controller.addNote();
      controller.elementContainerDivRefs.notifyOnChanges();

      // then
      expect(div.scrollIntoView).not.toHaveBeenCalled();
   });

   function controllerWithContainers(...divs: HTMLDivElement[]): ViewControllerTestable {
      const controller = new ViewControllerTestable();
      controller['scene'] = SceneFactory.createScene('1', []);
      controller.elementContexts = [new SummaryContext([]), new SummaryContext([])];
      controller.elementContainerDivRefs = new QueryList<ElementRef<HTMLDivElement>>();
      controller.elementContainerDivRefs.reset(divs.map(div => new ElementRef(div)));
      controller.ngAfterViewInit();
      return controller;
   }

   it('#addChart should notify added element context', () => {

      // given
      const controller = new ViewControllerTestable();
      controller['columns'] = [];
      controller['chartMarginService'] = new ChartMarginService();
      controller.sidenav = viewController.sidenav;
      controller.elementContexts = [];

      // when
      const context = controller.addChart();

      // then
      expect(controller.addedContexts).toEqual([context]);
   });

   it.each([
      { add: (controller: ViewControllerTestable) => controller.addNote(), tiled: false },
      { add: (controller: ViewControllerTestable) => controller.addTextTile(), tiled: true }
   ])('#add text box should add and persist text box of tiled $tiled without opening sidenav nor changing selected context',
      ({ add, tiled }) => {

      // given
      const controller = new ViewControllerTestable();
      controller['columns'] = [];
      const sidenav = { mode: null, open: vi.fn() };
      controller.sidenav = sidenav as unknown as MatSidenav;
      const selectedContext = new SummaryContext([]);
      controller.selectedContext = selectedContext;
      controller.elementContexts = [];
      const requestPersistSpy = vi.spyOn(controller as unknown as { requestPersist: () => void }, 'requestPersist');

      // when
      const context = add(controller);

      // then
      expect(context).toBeInstanceOf(TextBoxContext);
      expect(context.tiled).toBe(tiled);
      expect(controller.elementContexts).toEqual([context]);
      expect(controller.addedContexts).toEqual([context]);
      expect(requestPersistSpy).toHaveBeenCalled();
      expect(sidenav.open).not.toHaveBeenCalled();
      expect(controller.selectedContext).toBe(selectedContext);
   });

   it('#addTextTile should add bordered text tile requested to be edited', () => {

      // given
      const controller = controllerWith();
      controller['columns'] = [];

      // when
      const context = controller.addTextTile();

      // then
      expect(context.bordered).toBe(true);
      expect(context.backgroundColor).toBeUndefined();
      expect(context.editRequested).toBe(true);
   });

   it('#addNote should add translucent yellow note requested to be edited', () => {

      // given
      const controller = controllerWith();
      controller['columns'] = [];

      // when
      const context = controller.addNote();

      // then
      expect(context.backgroundColor).toBe(TextBoxContext.NOTE_BACKGROUND_COLOR);
      expect(context.bordered).toBe(false);
      expect(context.editRequested).toBe(true);
   });

   it('#isTextBoxContext should return true when text box context', () => {
      expect(viewController.isTextBoxContext(new TextBoxContext([]))).toBe(true);
   });

   it('#isTextBoxContext should return false when not text box context', () => {
      expect(viewController.isTextBoxContext(new SummaryContext([]))).toBe(false);
   });

   function controllerWith(...contexts: ElementContext[]): ViewControllerTestable {
      const controller = new ViewControllerTestable();
      controller.sidenav = { mode: null, open: vi.fn() } as unknown as MatSidenav;
      controller.elementContexts = contexts;
      return controller;
   }

   it.each([
      { case: 'forward', previousIndex: 0, currentIndex: 2, expected: ['textBox', 'tile2', 'tile3', 'tile1'] },
      { case: 'backward', previousIndex: 2, currentIndex: 0, expected: ['tile3', 'tile1', 'textBox', 'tile2'] },
      { case: 'past text box', previousIndex: 0, currentIndex: 1, expected: ['textBox', 'tile2', 'tile1', 'tile3'] }
   ])('#drop should map tile indexes $case to element indexes when text box is between tiles', ({ previousIndex, currentIndex, expected }) => {

      // given
      const controller = controllerWith(...titledContexts());

      // when
      controller.drop({ previousIndex, currentIndex } as CdkDragDrop<object>);

      // then
      expect(controller.elementContexts.map(c => c.title)).toEqual(expected);
   });

   function titledContexts(): ElementContext[] {
      return ['tile1', 'textBox', 'tile2', 'tile3'].map(title => {
         const context = title === 'textBox' ? new TextBoxContext([]) : new SummaryContext([]);
         context.title = title;
         return context;
      });
   }

   it('#configure should set position among tiles', () => {

      // given
      const controller = controllerWith(...titledContexts());

      // when
      controller.configure(null, controller.elementContexts[2]);

      // then
      expect(controller.selectedContextPosition).toBe(2);
   });

   it('#changeElementPosition should move selected tile to position among tiles', () => {

      // given
      const controller = controllerWith(...titledContexts());
      controller.configure(null, controller.elementContexts[3]);

      // when
      controller.changeElementPosition(1);

      // then
      expect(controller.elementContexts.map(c => c.title)).toEqual(['tile3', 'tile1', 'textBox', 'tile2']);
      expect(controller.selectedContextPosition).toBe(1);
   });

   it('#tileCount should not count overlays', () => {

      // given
      const controller = controllerWith(...titledContexts());

      // when
      const count = controller.tileCount();

      // then
      expect(count).toBe(3);
   });

   it('#removeElement should clear anchors of text boxes anchored to removed element', () => {

      // given
      const [removed, kept] = [new SummaryContext([]), new SummaryContext([])];
      const anchoredToRemoved = new TextBoxContext([]);
      anchoredToRemoved.setAnchor(removed, { x: 0.5, y: 0.5 });
      const anchoredToKept = new TextBoxContext([]);
      anchoredToKept.setAnchor(kept, { x: 0.5, y: 0.5 });
      const controller = controllerWith(removed, anchoredToRemoved, kept, anchoredToKept);

      // when
      controller.removeElement(removed);

      // then
      expect(controller.elementContexts).toEqual([anchoredToRemoved, kept, anchoredToKept]);
      expect(anchoredToRemoved.anchor).toBeUndefined();
      expect(anchoredToKept.anchor).toBe(kept);
   });

   it('#canGenerateDashboard should return false while loading', () => {

      // given
      const controller = new ViewControllerTestable();
      controller.entries = [{ a: 1 }];
      controller.loading = true;

      // when
      const result = controller.canGenerateDashboard();

      // then
      expect(result).toBe(false);
   });

   it('#canGenerateDashboard should return false without entries', () => {

      // given
      const controller = new ViewControllerTestable();
      controller.entries = [];
      controller.loading = false;

      // when
      const result = controller.canGenerateDashboard();

      // then
      expect(result).toBe(false);
   });

   it('#canGenerateDashboard should return true when entries are loaded', () => {

      // given
      const controller = new ViewControllerTestable();
      controller.entries = [{ a: 1 }];
      controller.loading = false;

      // when
      const result = controller.canGenerateDashboard();

      // then
      expect(result).toBe(true);
   });

});
