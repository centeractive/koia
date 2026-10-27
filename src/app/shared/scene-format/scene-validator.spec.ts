import examples from '@centeractive/koia-scene-schema/examples.json';
import schemas from '@centeractive/koia-scene-schema/schemas.json';
import versions from 'assets/scene-format/versions.json';
import { SceneValidator } from './scene-validator';

const SCHEMA_VERSION_PATH = '/schemaVersion';
const invalidExamples = Object.entries(examples['1.0'].invalid);

describe('SceneValidator', () => {

   const validator = new SceneValidator();

   Object.entries(examples['1.0'].valid).forEach(([name, document]) => {

      it('#validate should accept valid example ' + name, () => {

         // when
         const validation = validator.validate(document);

         // then
         expect(validation.supported).toBe(true);
         expect(validation.errors).toEqual([]);
      });
   });

   invalidExamples.filter(([, example]) => example.expectedErrorPath !== SCHEMA_VERSION_PATH).forEach(([name, example]) => {

      it('#validate should report invalid example ' + name + ' at expected path', () => {

         // when
         const validation = validator.validate(example.document);

         // then
         expect(validation.supported).toBe(true);
         expect(validation.errors.map(e => e.path)).toContain(example.expectedErrorPath);
      });
   });

   invalidExamples.filter(([, example]) => example.expectedErrorPath === SCHEMA_VERSION_PATH).forEach(([name, example]) => {

      it('#validate should report invalid example ' + name + ' as unsupported version', () => {

         // when
         const validation = validator.validate(example.document);

         // then
         expect(validation.versioned).toBe(true);
         expect(validation.supported).toBe(false);
         expect(validation.errors).toEqual([]);
      });
   });

   it('#validate should treat document without schema version as legacy 1.0', () => {

      // when
      const validation = validator.validate(examples['1.0'].valid.minimal);

      // then
      expect(validation.versioned).toBe(false);
      expect(validation.version).toBe('1.0');
   });

   it('#validate should mark document with schema version as versioned', () => {

      // when
      const validation = validator.validate({ ...examples['1.0'].valid.minimal, schemaVersion: '1.0' });

      // then
      expect(validation.versioned).toBe(true);
      expect(validation.version).toBe('1.0');
      expect(validation.supported).toBe(true);
   });

   it('#validate should report minor above supported versions as unsupported', () => {

      // given
      const validator10 = new SceneValidator(['1.0']);

      // when
      const validation = validator10.validate({ ...examples['1.0'].valid.minimal, schemaVersion: '1.1' });

      // then
      expect(validation).toEqual({ version: '1.1', versioned: true, supported: false, errors: [] });
   });

   it('#validate should report unknown major as unsupported', () => {

      // when
      const validation = validator.validate({ ...examples['1.0'].valid.minimal, schemaVersion: '9.0' });

      // then
      expect(validation).toEqual({ version: '9.0', versioned: true, supported: false, errors: [] });
   });

   it('#validate should report missing property at root path', () => {

      // when
      const validation = validator.validate(examples['1.0'].invalid['missing-columns'].document);

      // then
      expect(validation.errors).toEqual([{ path: '', message: 'must have required property \'columns\'' }]);
   });

   it('#validate should accept properties reserved for Koia', () => {

      // given
      const sample = examples['1.0'].valid['koia-sample'];
      const document = {
         ...sample,
         schemaVersion: '1.0',
         columns: [...sample.columns, {
            name: 'Price', dataType: 'Number', width: 10, groupingTimeUnit: 'day',
            computation: { leftColumn: 'Revenue', operator: 'divide', rightColumn: 'Quantity' }
         }],
         config: { savedViews: [{ name: 'Overview', modifiedTime: 1, tabs: [] }] }
      };

      // when
      const validation = validator.validate(document);

      // then
      expect(validation.errors).toEqual([]);
   });

   it('should provide published schema for every supported version', () => {

      // when
      const unpublished = versions.versions.filter(v => !Object.keys(schemas).includes(v));

      // then
      expect(unpublished).toEqual([]);
   });

   it('#validateEntries should return no errors for valid entries', () => {

      // when
      const errors = validator.validateEntries('1.0', [{ a: 'x', b: 1, c: true }, { d: 2 }]);

      // then
      expect(errors).toEqual([]);
   });

   it('#validateEntries should return no errors for no entries', () => {

      // when
      const errors = validator.validateEntries('1.0', []);

      // then
      expect(errors).toEqual([]);
   });

   it('#validateEntries should return errors of first invalid entry with its index in path', () => {

      // when
      const errors = validator.validateEntries('1.0', [{ a: 1 }, { b: {} }, { c: null }]);

      // then
      expect(errors.length).toBeGreaterThan(0);
      errors.forEach(e => expect(e.path).toBe('/1/b'));
   });
});
