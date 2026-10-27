import { Attribute } from './attribute';
import { DataType } from './data-type.enum';

describe('Attribute', () => {

   it('should provide constructor values and not be wide by default', () => {

      // when
      const attribute = new Attribute('name.key', 'description.key', DataType.TEXT, 'x');

      // then
      expect(attribute.name).toBe('name.key');
      expect(attribute.description).toBe('description.key');
      expect(attribute.dataType).toBe(DataType.TEXT);
      expect(attribute.value).toBe('x');
      expect(attribute.wide).toBe(false);
   });

   it('should be wide when requested', () => {
      expect(new Attribute('name.key', undefined, DataType.TEXT, '', true).wide).toBe(true);
   });

   it('#value should be changeable', () => {

      // given
      const attribute = new Attribute('name.key', undefined, DataType.NUMBER, 1);

      // when
      attribute.value = 2;

      // then
      expect(attribute.value).toBe(2);
   });

   it.each([
      [DataType.BOOLEAN, true, false],
      [DataType.NUMBER, false, true],
      [DataType.TEXT, false, false]
   ])('data type %s should be boolean %s and number %s', (dataType, isBoolean, isNumber) => {

      // when
      const attribute = new Attribute('name.key', undefined, dataType, undefined);

      // then
      expect(attribute.isBoolean()).toBe(isBoolean);
      expect(attribute.isNumber()).toBe(isNumber);
   });

   it('#hasValueChoice should be false without choice', () => {
      expect(new Attribute('name.key', undefined, DataType.TEXT, '').hasValueChoice()).toBe(false);
   });

   it('#hasValueChoice should be false with empty choice', () => {

      // given
      const attribute = new Attribute('name.key', undefined, DataType.TEXT, '');

      // when
      attribute.valueChoice = [];

      // then
      expect(attribute.hasValueChoice()).toBe(false);
   });

   it('#hasValueChoice should be true with choice', () => {

      // given
      const attribute = new Attribute('name.key', undefined, DataType.TEXT, '');

      // when
      attribute.valueChoice = ['a', 'b'];

      // then
      expect(attribute.hasValueChoice()).toBe(true);
      expect(attribute.valueChoice).toEqual(['a', 'b']);
   });
});
