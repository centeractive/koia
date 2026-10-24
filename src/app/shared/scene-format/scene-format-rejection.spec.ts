import { rejectionOf } from './scene-format-rejection';
import { SceneValidation } from './scene-validator';

const SUPPORTED_VERSIONS = ['1.0', '1.1'];

describe('rejectionOf', () => {

   it('should reject unsupported version naming supported versions', () => {

      // given
      const validation: SceneValidation = { version: '9.0', versioned: true, supported: false, errors: [] };

      // when
      const rejection = rejectionOf(validation, SUPPORTED_VERSIONS);

      // then
      expect(rejection).toBe('scene format 9.0 is not supported by this Koia version (supported: 1.0, 1.1)');
   });

   it('should reject versioned invalid document listing all errors', () => {

      // given
      const validation: SceneValidation = {
         version: '1.0', versioned: true, supported: true, errors: [
            { path: '/database', message: 'must NOT have fewer than 1 characters' },
            { path: '/columns/0/dataType', message: 'must be equal to one of the allowed values' }
         ]
      };

      // when
      const rejection = rejectionOf(validation, SUPPORTED_VERSIONS);

      // then
      expect(rejection).toBe('scene does not comply with scene format 1.0:\n' +
         '/database: must NOT have fewer than 1 characters\n' +
         '/columns/0/dataType: must be equal to one of the allowed values');
   });

   it('should render root error path as slash', () => {

      // given
      const validation: SceneValidation = {
         version: '1.0', versioned: true, supported: true, errors: [{ path: '', message: 'must have required property \'columns\'' }]
      };

      // when
      const rejection = rejectionOf(validation, SUPPORTED_VERSIONS);

      // then
      expect(rejection).toBe('scene does not comply with scene format 1.0:\n/: must have required property \'columns\'');
   });

   it('should not reject legacy invalid document', () => {

      // given
      const validation: SceneValidation = {
         version: '1.0', versioned: false, supported: true, errors: [{ path: '/database', message: 'must be string' }]
      };

      // when
      const rejection = rejectionOf(validation, SUPPORTED_VERSIONS);

      // then
      expect(rejection).toBeUndefined();
   });

   it('should not reject valid document', () => {

      // given
      const validation: SceneValidation = { version: '1.0', versioned: true, supported: true, errors: [] };

      // when
      const rejection = rejectionOf(validation, SUPPORTED_VERSIONS);

      // then
      expect(rejection).toBeUndefined();
   });
});
