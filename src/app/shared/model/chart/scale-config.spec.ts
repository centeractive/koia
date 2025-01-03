import { fakeAsync, flush } from '@angular/core/testing';
import { ScaleConfig, TicksConfig } from '.';

describe('ScaleConfig - specific column', () => {

    let onChangeSpy: jasmine.Spy;
    let scaleConfig: ScaleConfig;

    beforeEach(() => {
        onChangeSpy = jasmine.createSpy('onChange');
        scaleConfig = new ScaleConfig(onChangeSpy, {
            columnName: 'X',
            ticks: {}
        });
    });

    it('#ticks should not fire change event when ticks did not change', fakeAsync(() => {

        // when
        scaleConfig.ticks = new TicksConfig(onChangeSpy, {});

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: 'X',
            ticks: {
                stepSize: undefined,
                rotation: undefined
            }
        });
        expect(onChangeSpy).not.toHaveBeenCalled();
    }));

    it('#ticks should fire change event when ticks changed', fakeAsync(() => {
        // given
        const ticks = new TicksConfig(onChangeSpy, { stepSize: 2 });
        onChangeSpy.calls.reset();


        // when
        scaleConfig.ticks = ticks;

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: 'X',
            ticks: {
                stepSize: 2,
                rotation: undefined
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    }));

    it('#ticks#stepSize should fire change event', fakeAsync(() => {

        // when
        scaleConfig.ticks.stepSize = 10;

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: 'X',
            ticks: {
                stepSize: 10,
                rotation: undefined
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    }));

    it('#ticks#rotation should fire change event', fakeAsync(() => {

        // when
        scaleConfig.ticks.rotation = 45;

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: 'X',
            ticks: {
                stepSize: undefined,
                rotation: 45
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    }));
});

describe('ScaleConfig - generic', () => {

    let onChangeSpy: jasmine.Spy;
    let scaleConfig: ScaleConfig;

    beforeEach(() => {
        onChangeSpy = jasmine.createSpy('onChange');
        scaleConfig = new ScaleConfig(onChangeSpy);
    });

    it('#ticks should not fire change event when ticks did not change', fakeAsync(() => {

        // when
        scaleConfig.ticks = new TicksConfig(onChangeSpy, {});

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: undefined,
            ticks: {
                stepSize: undefined,
                rotation: undefined
            }
        });
        expect(onChangeSpy).not.toHaveBeenCalled();
    }));

    it('#ticks should fire change event when ticks changed', fakeAsync(() => {
        // given
        const ticks = new TicksConfig(onChangeSpy, { stepSize: 2 });
        onChangeSpy.calls.reset();


        // when
        scaleConfig.ticks = ticks;

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: undefined,
            ticks: {
                stepSize: 2,
                rotation: undefined
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    }));

    it('#ticks#stepSize should fire change event', fakeAsync(() => {

        // when
        scaleConfig.ticks.stepSize = 10;

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: undefined,
            ticks: {
                stepSize: 10,
                rotation: undefined
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    }));

    it('#ticks#rotation should fire change event', fakeAsync(() => {

        // when
        scaleConfig.ticks.rotation = 45;

        // then
        flush();
        expect(scaleConfig.toScale()).toEqual({
            columnName: undefined,
            ticks: {
                stepSize: undefined,
                rotation: 45
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    }));
});