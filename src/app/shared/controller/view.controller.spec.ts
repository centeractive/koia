import { ChartContext, ChartType } from '../model/chart';
import { GraphContext } from '../model';
import { MatSidenav } from '@angular/material';
import { View } from '../model/view-config';
import { ViewController } from './view.controller';

class ViewControllerTestable extends ViewController {

   constructor() {
      super(null, null, null, null, null, null, null, null, null);
   }

   protected onPreRestoreView(view: View): void { }

   protected onPreSaveView(view: View): void { }
}

describe('ViewController', () => {

   let viewController: ViewControllerTestable;

   beforeAll(() => {
      const sidenav = {
         mode: null,
         open: () => null
      };
      viewController = new ViewControllerTestable();
      viewController.sidenav = <MatSidenav>sidenav;
   });

   it('#isShowResizableMargin should return false when not chart context', () => {

      // when
      const result = viewController.isShowResizableMargin(new GraphContext([]));

      // then
      expect(result).toBeFalsy();
   });

   it('#isShowResizableMargin should return false when chart context but not showing margin', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });

      // when
      const result = viewController.isShowResizableMargin(chartContext);

      // then
      expect(result).toBeFalsy();
   });

   it('#isShowResizableMargin should return true when chart context and showing margin', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      chartContext.toggleShowResizableMargin();

      // when
      const result = viewController.isShowResizableMargin(chartContext);

      // then
      expect(result).toBeTruthy();
   });

   it('#configure should open sidenav in "push" mode when element is far left', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      viewController.elementContexts = [chartContext];
      spyOn(viewController.sidenav, 'open');

      // when
      viewController.configure(<MouseEvent> { clientX: ViewController.SIDENAV_WIDTH - 1 }, chartContext);

      // then
      expect(viewController.sidenav.mode).toBe('push');
      expect(viewController.sidenav.open).toHaveBeenCalled();
   });

   it('#configure should open sidenav in "over" mode when element is not far left', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      viewController.elementContexts = [chartContext];
      spyOn(viewController.sidenav, 'open');

      // when
      viewController.configure(<MouseEvent> { clientX: ViewController.SIDENAV_WIDTH + 1 }, chartContext);

      // then
      expect(viewController.sidenav.mode).toBe('over');
      expect(viewController.sidenav.open).toHaveBeenCalled();
    });

    it('#configure should open sidenav in "over" mode when x-position is missing in mouse event', () => {

      // given
      const chartContext = new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 });
      viewController.elementContexts = [chartContext];
      spyOn(viewController.sidenav, 'open');

      // when
      viewController.configure(<MouseEvent> {}, chartContext);

      // then
      expect(viewController.sidenav.mode).toBe('over');
      expect(viewController.sidenav.open).toHaveBeenCalled();
   });
});
