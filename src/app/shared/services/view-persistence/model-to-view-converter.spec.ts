import { ElementContext, Query, Route } from 'app/shared/model';
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
});
