import Ajv from 'ajv';
import { ViewType } from 'app/shared/model/view-config';
import { rejectionOf, textOf } from 'app/shared/scene-format/scene-format-rejection';
import { SceneFormatError, SceneValidator, sceneFormatErrorsOf } from 'app/shared/scene-format/scene-validator';
import { LanguageService } from 'app/shared/services/language';
import { SCENE_FILE_FORMAT, SCENE_FILE_VERSION, SceneFile } from './scene-file';

const SCENE_FILE_SCHEMA = {
   type: 'object',
   required: ['format', 'version', 'scene', 'tabs', 'entries'],
   properties: {
      format: { const: SCENE_FILE_FORMAT },
      version: { const: SCENE_FILE_VERSION },
      scene: {
         type: 'object',
         properties: {
            _id: false,
            _rev: false,
            config: {
               type: 'object',
               properties: {
                  savedViews: { type: 'array', items: { $ref: '#/definitions/savedView' } }
               }
            }
         }
      },
      tabs: { type: 'array', items: { $ref: '#/definitions/tab' } },
      entries: { type: 'array', items: { type: 'object', propertyNames: { not: { pattern: '^_' } } } }
   },
   definitions: {
      tab: {
         type: 'object',
         required: ['id', 'type', 'title'],
         properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: Object.values(ViewType) },
            title: { type: 'string' },
            view: { type: 'object' },
            record: { type: 'object' }
         }
      },
      savedView: {
         type: 'object',
         required: ['name', 'modifiedTime', 'tabs', 'rawData'],
         properties: {
            name: { type: 'string' },
            modifiedTime: { type: 'number' },
            tabs: { type: 'array', items: { $ref: '#/definitions/tab' } },
            activeTabId: { type: 'string' },
            rawData: { type: 'object' }
         }
      }
   }
};

/**
 * validates the content of a scene file, its scene strictly against the scene format
 */
export class SceneFileValidator {

   private readonly sceneValidator = new SceneValidator();
   private readonly validateEnvelope = new Ajv().compile(SCENE_FILE_SCHEMA);

   /**
    * @returns the reason why the content of a scene file must not be imported, undefined when it may be imported
    */
   rejectionOf(content: unknown): string | undefined {
      if (!this.validateEnvelope(content)) {
         return this.invalid(sceneFormatErrorsOf(this.validateEnvelope.errors));
      }
      const sceneFile = content as SceneFile;
      const validation = this.sceneValidator.validate(sceneFile.scene);
      const rejection = rejectionOf(validation, this.sceneValidator.supportedVersions, true);
      if (rejection) {
         return rejection;
      }
      const errors = this.sceneValidator.validateEntries(validation.version, sceneFile.entries);
      return errors.length ? this.invalid(errors.map(e => ({ ...e, path: '/entries' + e.path }))) : undefined;
   }

   private invalid(errors: SceneFormatError[]): string {
      return LanguageService.instant('sceneFile.invalid', { errors: textOf(errors) });
   }
}
