import { Scene } from '../model';

/**
 * @returns the human readable CSS column with measurement of the specified scene
 */
export function colWidthMeasurementToDisplay(scene: Scene): string {
    return colWidthMeasurementOf(scene) === 'em' ? 'chars' : 'pixel';
}

/**
 * @returns the CSS column with measurement of the specified scene
 */
export function colWidthMeasurementOf(scene: Scene): 'em' | 'px' {
    if (isSourceRetrospective(scene)) {
        return 'px';
    }
    return 'em';
}

/**
 * indicates if the specified scene was issued by the Retrospective Log analyzer
 */
export function isSourceRetrospective(scene: Scene): boolean {
    return !!scene.context?.find(o => o.name === 'Profile');
}