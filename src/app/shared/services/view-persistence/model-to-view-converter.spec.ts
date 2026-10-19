import { Aggregation, ElementContext, Query, Route, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ElementType } from 'app/shared/model/view-config';
import { ModelToViewConverter } from './model-to-view-converter';
import { TextBox } from './text-box.type';

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
      { type: 'summary', create: () => new SummaryContext([]) },
      { type: 'text box', create: () => new TextBoxContext([]) }
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

   it('#convert should map text box', () => {

      // given
      const context = new TextBoxContext([]);
      context.title = 'Notes';
      context.content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] };
      context.backgroundColor = '#ffff00';

      // when
      const view = converter.convert(Route.GRID, 'test', new Query(), [context]);

      // then
      expect(view.elements[0]).toEqual({
         elementType: ElementType.TEXT_BOX,
         title: 'Notes',
         gridColumnSpan: 1,
         gridRowSpan: 1,
         width: 300,
         height: 150,
         x: undefined,
         y: undefined,
         z: undefined,
         dataColumns: [],
         splitColumns: [],
         groupByColumns: [],
         aggregations: [Aggregation.COUNT],
         valueGroupings: [],
         colorOptions: context.colorProvider.options,
         content: context.content,
         backgroundColor: '#ffff00',
         tiled: false,
         bordered: false,
         borderWidth: 1
      });
   });

   it('#convert should map border width and color of text box', () => {

      // given
      const context = new TextBoxContext([]);
      context.borderWidth = 3;
      context.borderColor = '#ff0000';

      // when
      const view = converter.convert(Route.GRID, 'test', new Query(), [context]);

      // then
      const element = view.elements[0] as TextBox;
      expect([element.borderWidth, element.borderColor]).toEqual([3, '#ff0000']);
   });

   it('#convert should map tiled and bordered of text tile', () => {

      // given
      const context = new TextBoxContext([], true);
      context.bordered = true;

      // when
      const view = converter.convert(Route.GRID, 'test', new Query(), [context]);

      // then
      const element = view.elements[0] as TextBox;
      expect([element.tiled, element.bordered]).toEqual([true, true]);
   });

   it('#convert should map anchor of text box to index of anchor element', () => {

      // given
      const summary = new SummaryContext([]);
      const textBox = new TextBoxContext([]);
      textBox.setAnchor(summary, { x: 0.25, y: 0.75 });

      // when
      const view = converter.convert(Route.GRID, 'test', new Query(), [textBox, new GraphContext([]), summary]);

      // then
      const element = view.elements[0] as TextBox;
      expect([element.anchor, element.anchorX, element.anchorY]).toEqual([2, 0.25, 0.75]);
   });

   it.each([
      { case: 'without anchor', anchor: undefined },
      { case: 'with anchor not converted', anchor: new SummaryContext([]) }
   ])('#convert should not map anchor of text box $case', ({ anchor }) => {

      // given
      const textBox = new TextBoxContext([]);
      textBox.setAnchor(anchor, { x: 0.25, y: 0.75 });

      // when
      const view = converter.convert(Route.GRID, 'test', new Query(), [textBox]);

      // then
      expect(view.elements[0]).not.toHaveProperty('anchor');
      expect(view.elements[0]).not.toHaveProperty('anchorX');
      expect(view.elements[0]).not.toHaveProperty('anchorY');
   });
});
