import { LanguageService } from 'app/shared/services/language';
import { SceneFormatError, SceneValidation } from './scene-validator';

/**
 * @returns the reason why the validated scene must not be opened, [[undefined]] when it may be opened; a document without scene
 * format version is never rejected because writers released before scene formats were versioned must keep working, unless
 * strict rejects violations of documents without version too
 */
export function rejectionOf(validation: SceneValidation, supportedVersions: string[], strict = false): string | undefined {
   const { version, versioned, supported, errors } = validation;
   if (!supported) {
      return LanguageService.instant('sceneFormat.unsupportedVersion', { version, supported: supportedVersions.join(', ') });
   }
   if ((versioned || strict) && errors.length) {
      return LanguageService.instant('sceneFormat.invalid', { version, errors: textOf(errors) });
   }
   return undefined;
}

export function textOf(errors: SceneFormatError[]): string {
   return errors.map(e => (e.path || '/') + ': ' + e.message).join('\n');
}
