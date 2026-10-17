import { Scene } from '../model';
import { SceneFactory } from '../test';
import { colWidthMeasurementOf, colWidthMeasurementToDisplay, isSourceRetrospective } from './source-system';

describe('source-system', () => {

    it.each(['Profile', 'Data Sources'])('should measure columns in pixel when scene context contains "%s"', name => {

        // given
        const scene: Scene = { ...SceneFactory.createScene('1', []), context: [{ name, value: 'x' }] };

        // when
        const retrospective = isSourceRetrospective(scene);

        // then
        expect(retrospective).toBe(true);
        expect(colWidthMeasurementOf(scene)).toBe('px');
        expect(colWidthMeasurementToDisplay(scene)).toBe('pixel');
    });

    it('should measure columns in chars when scene context contains other infos', () => {

        // given
        const scene: Scene = { ...SceneFactory.createScene('1', []), context: [{ name: 'Other', value: 'x' }] };

        // when
        const retrospective = isSourceRetrospective(scene);

        // then
        expect(retrospective).toBe(false);
        expect(colWidthMeasurementOf(scene)).toBe('em');
        expect(colWidthMeasurementToDisplay(scene)).toBe('chars');
    });

    it('should measure columns in chars when scene has no context', () => {

        // given
        const scene = SceneFactory.createScene('1', []);

        // when
        const retrospective = isSourceRetrospective(scene);

        // then
        expect(retrospective).toBe(false);
        expect(colWidthMeasurementOf(scene)).toBe('em');
        expect(colWidthMeasurementToDisplay(scene)).toBe('chars');
    });
});
