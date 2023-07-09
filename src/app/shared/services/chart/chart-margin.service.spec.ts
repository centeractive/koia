import { ChartType, Margin } from '../../model/chart';
import { ChartMarginService, defaultMargin } from './chart-margin.service';

describe('ChartMarginService', () => {

   let chartMarginService: ChartMarginService;

   beforeEach(() => {
      chartMarginService = new ChartMarginService();
   });

   it('#marginOf should return default margin when chart type is null', () => {

      // when
      const margin = chartMarginService.marginOf(null);

      // then
      expect(margin).toEqual(defaultMargin());
   });

   it('#marginOf should return default margin when chart type is undefined', () => {

      // when
      const margin = chartMarginService.marginOf(undefined);

      // then
      expect(margin).toEqual(defaultMargin());
   });

   it('#marginOf should return default margin when no other margin was remembered', () => {
      for (const chartType of ChartType.ALL) {
         expect(chartMarginService.marginOf(chartType)).toBeTruthy();
      }
   });

   it('#marginOf should return remembered margin', () => {

      // given
      const marginToRemember: Margin = { top: 10, right: 20, bottom: 30, left: 40 };
      chartMarginService.remember(ChartType.PIE, marginToRemember);

      // when
      const margin = chartMarginService.marginOf(ChartType.PIE);

      // then
      expect(margin).toEqual(marginToRemember);
   });

   it('#marginOf should return default margin when service was reset', () => {

      // given
      chartMarginService.remember(ChartType.PIE, { top: 10, right: 20, bottom: 30, left: 40 });
      chartMarginService.reset();

      // when
      const margin = chartMarginService.marginOf(ChartType.PIE);

      // then
      expect(margin).toEqual(defaultMargin());
   });

   it('#computeMargin should return computed margin when top-left corner was reiszed', () => {

      // given
      const margin = { top: 0, right: 0, bottom: 0, left: 0 };
      const resizeEvent = {
         rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
         edges: { top: 1, left: 2 }
      };

      // when
      const computedMargin = chartMarginService.computeMargin(margin, resizeEvent);

      // then
      expect(computedMargin).toEqual({ top: 1, right: 0, bottom: 0, left: 2 });
   });

   it('#computeMargin should return computed margin when bottom-right corner was reiszed', () => {

      // given
      const margin = { top: 0, right: 0, bottom: 0, left: 0 };
      const resizeEvent = {
         rectangle: { top: 0, right: 0, bottom: 0, left: 0 },
         edges: { right: -1, bottom: -2 }
      }

      // when
      const computedMargin = chartMarginService.computeMargin(margin, resizeEvent);

      // then
      expect(computedMargin).toEqual({ top: 0, right: 1, bottom: 2, left: 0 });
   });

   it('#marginToStyle should return margin style', () => {

      // when
      const marginStyle = chartMarginService.marginToStyle({ top: 1, right: 2, bottom: 3, left: 4 }, 10);

      // then
      expect(marginStyle).toEqual({ top: '11px', right: '2px', bottom: '3px', left: '4px' });
   });
});
