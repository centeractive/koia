import { Aggregation, Column, DataType, ElementContext, Query, Route, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { ElementType, ViewElement } from 'app/shared/model/view-config';
import { Chart } from './chart.type';
import { ModelToViewConverter } from './model-to-view-converter';
import { TextBox } from './text-box.type';
import { ViewToModelConverter } from './view-to-model-converter';

describe('ViewToModelConverter', () => {

   const columns: Column[] = [
      { name: 'Time', dataType: DataType.TIME, width: 100 },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 }
   ];
   const converter = new ViewToModelConverter(columns);

   it('#convert should throw error when element type is unknown', () => {

      // given
      const viewElement = { elementType: 99 as ElementType } as ViewElement;

      // when
      const convert = () => converter.convert([viewElement]);

      // then
      expect(convert).toThrow('view element of type 99 not yet implemented');
   });

   it('#convert should leave value scales undefined when chart has no value scales', () => {

      // given
      const chart: Chart = {
         elementType: ElementType.CHART, title: 'Test Chart', gridColumnSpan: 1, gridRowSpan: 1, width: 600, height: 600,
         dataColumns: [columns[2]], splitColumns: [], groupByColumns: [columns[1]], aggregations: [Aggregation.SUM],
         valueGroupings: [], chartType: 'barChart', margin: { top: 1, right: 2, bottom: 3, left: 4 }, showLegend: true,
         legendPosition: 'top', baseScale: undefined, valueScales: undefined, stacked: false, multiValueAxes: false,
         colorOptions: undefined
      };

      // when
      const contexts = converter.convert([chart]);

      // then
      const context = contexts[0] as ChartContext;
      expect(context).toBeInstanceOf(ChartContext);
      expect(context.dataColumns.map(c => c.name)).toEqual(['Amount']);
      expect(context.valueScales).toBeUndefined();
   });

   it('#convert should create text box context', () => {

      // given
      const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] };
      const textBox: TextBox = {
         elementType: ElementType.TEXT_BOX, title: 'Notes', gridColumnSpan: 2, gridRowSpan: 1, width: 400, height: 100,
         x: 10, y: 20, z: 3, dataColumns: [], splitColumns: [], groupByColumns: [], aggregations: [Aggregation.COUNT],
         valueGroupings: [], colorOptions: undefined, content, backgroundColor: '#ffff00'
      };

      // when
      const contexts = converter.convert([textBox]);

      // then
      const context = contexts[0] as TextBoxContext;
      expect(context).toBeInstanceOf(TextBoxContext);
      expect(context.title).toBe('Notes');
      expect([context.gridColumnSpan, context.width, context.height, context.x, context.y, context.z]).toEqual([2, 400, 100, 10, 20, 3]);
      expect(context.content).toEqual(content);
      expect(context.backgroundColor).toBe('#ffff00');
      expect(context.columns.map(c => c.name)).toEqual(['Time', 'Level', 'Amount']);
      expect(context.columns[0]).not.toBe(columns[0]);
   });

   it('#convert should restore text box converted to view', () => {

      // given
      const textBoxContext = new TextBoxContext(columns);
      textBoxContext.title = 'Notes';
      textBoxContext.setSize(500, 250);
      textBoxContext.setPosition(30, 40);
      textBoxContext.content = { type: 'doc', content: [{ type: 'paragraph', attrs: { textAlign: 'center' } }] };
      textBoxContext.backgroundColor = '#00ff00';
      const view = new ModelToViewConverter().convert(Route.FLEX, 'test', new Query(), [textBoxContext]);

      // when
      const contexts = converter.convert(view.elements);

      // then
      const context = contexts[0] as TextBoxContext;
      expect(context).toBeInstanceOf(TextBoxContext);
      expect(new ModelToViewConverter().convert(Route.FLEX, 'test', new Query(), [context]).elements).toEqual(view.elements);
   });

   function viewElementsOf(...contexts: ElementContext[]): ViewElement[] {
      return new ModelToViewConverter().convert(Route.GRID, 'test', new Query(), contexts).elements;
   }

   it('#convert should resolve anchor index of text box to restored context', () => {

      // given
      const elements = viewElementsOf(new TextBoxContext(columns), new SummaryContext(columns));
      Object.assign(elements[0], { anchor: 1, anchorX: 0.25, anchorY: 0.75 });

      // when
      const [textBox, summary] = converter.convert(elements) as [TextBoxContext, SummaryContext];

      // then
      expect(textBox.anchor).toBe(summary);
      expect(textBox.anchorOffset).toEqual({ x: 0.25, y: 0.75 });
   });

   it.each([
      { case: 'without anchor index', anchor: undefined },
      { case: 'with anchor index out of range', anchor: 2 },
      { case: 'with anchor index of overlay', anchor: 1 }
   ])('#convert should not anchor text box $case', ({ anchor }) => {

      // given
      const elements = viewElementsOf(new TextBoxContext(columns), new TextBoxContext(columns));
      Object.assign(elements[0], { anchor, anchorX: 0.25, anchorY: 0.75 });

      // when
      const [textBox] = converter.convert(elements) as TextBoxContext[];

      // then
      expect(textBox.anchor).toBeUndefined();
      expect(textBox.anchorOffset).toBeUndefined();
   });

   it('#convert should restore anchored text box converted to view', () => {

      // given
      const summary = new SummaryContext(columns);
      const textBox = new TextBoxContext(columns);
      textBox.setAnchor(summary, { x: 0.5, y: 0.125 });
      const elements = viewElementsOf(summary, textBox);

      // when
      const contexts = converter.convert(elements);

      // then
      expect(viewElementsOf(...contexts)).toEqual(elements);
      expect((contexts[1] as TextBoxContext).anchor).toBe(contexts[0]);
   });
});
