import { QueryParams } from './query-params';

describe('QueryParams', () => {

   let queryParams: QueryParams;

   beforeEach(() => {
      queryParams = new QueryParams();
      queryParams.set('1', 'one');
      queryParams.set('2', 'two');
      queryParams.set('3', 'three');
   });

   it('#key should contain all parameter keys', () => {
      expect(queryParams.keys).toEqual(['1', '2', '3']);
   });

   it('#get should return null when parameter does not exist', () => {
      expect(queryParams.get('0')).toBeNull();
   });

   it('#get should return value when parameter exists', () => {
      expect(queryParams.get('1')).toBe('one');
      expect(queryParams.get('2')).toBe('two');
      expect(queryParams.get('3')).toBe('three');
   });

   it('#has should return false when parameter does not exist', () => {
      expect(queryParams.has('4')).toBeFalse();
   });

   it('#has should return true when parameter exists', () => {
      expect(queryParams.has('1')).toBeTrue();
      expect(queryParams.has('2')).toBeTrue();
      expect(queryParams.has('3')).toBeTrue();
   });

   it('#getAll should return empty array when parameter does not exist', () => {
      expect(queryParams.getAll('0')).toEqual([]);
   });

   it('#getAll should return array with value when parameter exists', () => {
      expect(queryParams.getAll('1')).toEqual(['one']);
      expect(queryParams.getAll('2')).toEqual(['two']);
      expect(queryParams.getAll('3')).toEqual(['three']);
   });
});
