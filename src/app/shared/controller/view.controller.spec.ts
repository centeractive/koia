import { Directive, ElementRef, QueryList } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ChartContext, ChartType } from '../model/chart';
import { GraphContext } from '../model/graph';
import { SceneFactory } from '../test';
import { ViewController } from './view.controller';

@Directive()
class ViewControllerTestable extends ViewController {

   constructor() {
      super(null, null, null, null, null, null, null, null, null, null);
   }

   generateDashboard(): void { }

   protected onPreRestoreView(): void { }

   protected onPreSaveView(): void { }
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
