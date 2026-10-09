import { TicksConfig } from './ticks-config';
import type { Mock } from 'vitest';

describe('TicksConfig', () => {

    let onChangeSpy: Mock;
    let ticksConfig: TicksConfig;

    beforeEach(() => {
        onChangeSpy = vi.fn();
        ticksConfig = new TicksConfig(onChangeSpy);
    });

    it('#stepSize should not fire change event when stepSize is not changed', () => {

        // given
        ticksConfig.stepSize = 10;
        vi.mocked(onChangeSpy).mockClear();

        // when
        ticksConfig.stepSize = 10;

        // then
        expect(ticksConfig.stepSize).toBe(10);
        expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('#stepSize should fire change event when stepSize is changed', () => {

        // when
        ticksConfig.stepSize = 5;

        // then
        expect(ticksConfig.stepSize).toBe(5);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('#rotation should not fire change event when rotation is not changed', () => {

        // given
        ticksConfig.rotation = 45;
        vi.mocked(onChangeSpy).mockClear();

        // when
        ticksConfig.rotation = 45;

        // then
        expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('#rotation should fire change event when rotation is changed', () => {

        // when
        ticksConfig.rotation = 20;

        // then
        expect(ticksConfig.rotation).toBe(20);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

});