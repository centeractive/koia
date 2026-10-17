import { ElementContext, Query, Route, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ModelToViewConverter } from './model-to-view-converter';

describe('ModelToViewConverter', () => {

   const converter = new ModelToViewConverter();

   it('#convert should throw error when context is unknown', () => {

      // given
      const context = {} as ElementContext;

      // when
      const convert = () => converter.convert(Route.GRID, 'test', new Query(), [context]);

      // then
      expect(convert).toThrow('unknown context [object Object]');
   });

   it.each([
      { type: 'chart', create: () => new ChartContext([], ChartType.BAR.type, { top: 0, right: 0, bottom: 0, left: 0 }) },
      { type: 'graph', create: () => new GraphContext([]) },
      { type: 'summary', create: () => new SummaryContext([]) }
   ])('#convert should map layout of $type', ({ create }) => {

      // given
      const context = create();
      context.gridColumnSpan = 2;
      context.gridRowSpan = 3;
      context.setSize(300, 200);
      context.setPosition(10, 20);
      context.z = 4;

      // when
      const view = converter.convert(Route.FLEX, 'test', new Query(), [context]);

      // then
      expect(view.elements[0]).toEqual(expect.objectContaining({
         gridColumnSpan: 2, gridRowSpan: 3, width: 300, height: 200, x: 10, y: 20, z: 4
      }));
   });

   it('#convert should leave position undefined for unplaced element', () => {

      // when
      const view = converter.convert(Route.FLEX, 'test', new Query(), [new SummaryContext([])]);

      // then
      expect([view.elements[0].x, view.elements[0].y, view.elements[0].z]).toEqual([undefined, undefined, undefined]);
   });
});
