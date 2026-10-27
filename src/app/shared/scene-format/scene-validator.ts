import schemas from '@centeractive/koia-scene-schema/schemas.json';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import { SceneInfo } from 'app/shared/model';
import versions from 'assets/scene-format/versions.json';

export interface SceneFormatError {
   /**
    * JSON Pointer of the violating value, '' for the document itself
    */
   path: string;
   message: string;
}

export interface SceneValidation {
   version: string;
   /**
    * [[true]] when the document declares its scene format version
    */
   versioned: boolean;
   supported: boolean;
   errors: SceneFormatError[];
}

export const LEGACY_SCENE_FORMAT_VERSION = '1.0';

export function sceneFormatErrorsOf(errors: ErrorObject[] | null | undefined): SceneFormatError[] {
   return (errors ?? []).map(e => ({ path: e.instancePath, message: e.message }));
}

/**
 * validates scene documents against the published scene format (https://github.com/centeractive/koia-scene-schema)
 */
export class SceneValidator {

   private readonly validators = new Map<string, ValidateFunction>();
   private readonly entryValidators = new Map<string, ValidateFunction>();

   constructor(readonly supportedVersions: string[] = versions.versions) {
      const ajv = new Ajv({ allErrors: true });
      ajv.addKeyword('x-since');
      supportedVersions.forEach(v => {
         this.validators.set(v, ajv.compile(schemas[v].scene));
         this.entryValidators.set(v, ajv.compile(schemas[v].entry));
      });
   }

   validate(doc: object): SceneValidation {
      const schemaVersion = (doc as SceneInfo).schemaVersion;
      const versioned = schemaVersion !== undefined;
      const version = versioned ? String(schemaVersion) : LEGACY_SCENE_FORMAT_VERSION;
      const validator = this.validators.get(version);
      if (!validator) {
         return { version, versioned, supported: false, errors: [] };
      }
      validator(doc);
      return { version, versioned, supported: true, errors: sceneFormatErrorsOf(validator.errors) };
   }

   /**
    * @returns the errors of the first invalid entry, their paths prefixed by its index
    */
   validateEntries(version: string, entries: object[]): SceneFormatError[] {
      const validator = this.entryValidators.get(version);
      const index = entries.findIndex(e => !validator(e));
      return index < 0 ? [] : sceneFormatErrorsOf(validator.errors).map(e => ({ ...e, path: '/' + index + e.path }));
   }
}
