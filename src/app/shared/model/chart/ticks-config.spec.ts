import { TicksConfig } from "./ticks-config";

describe('TicksConfig', () => {

    let onChangeSpy: jasmine.Spy;
    let ticksConfig: TicksConfig;

    beforeEach(() => {
        onChangeSpy = jasmine.createSpy('onChange');
        ticksConfig = new TicksConfig(onChangeSpy);
    });

    it('#stepSize should not fire look change event when stepSize is not changed', () => {

        // given
        ticksConfig.stepSize = 10;
        onChangeSpy.calls.reset();

        // when
        ticksConfig.stepSize = 10;

        // then
        expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('#stepSize should fire look change event when stepSize is changed', () => {

        // when
        ticksConfig.stepSize = 5;

        // then
        expect(ticksConfig.stepSize).toBe(5);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('#rotation should not fire look change event when rotation is not changed', () => {

        // given
        ticksConfig.rotation = 45;
        onChangeSpy.calls.reset();

        // when
        ticksConfig.rotation = 45;

        // then
        expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('#rotation should fire look change event when rotation is changed', () => {

        // when
        ticksConfig.rotation = 20;

        // then
        expect(ticksConfig.rotation).toBe(20);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

});