import { fakeAsync, flush } from '@angular/core/testing';
import { ScaleConfig, TicksConfig } from '.';
import type { Mock } from 'vitest';

describe('ScaleConfig - specific column', () => {

    let onChangeSpy: Mock;
    let scaleConfig: ScaleConfig;

    beforeEach(() => {
        onChangeSpy = vi.fn();
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
        vi.mocked(onChangeSpy).mockClear();


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

    it('#constructor should restore title of scale', () => {

        // when
        const config = new ScaleConfig(onChangeSpy, { columnName: 'X', title: 'Units', ticks: {} });

        // then
        expect(config.title).toBe('Units');
        expect(config.toScale().title).toBe('Units');
    });

    it('#title should fire change event', () => {

        // when
        scaleConfig.title = 'Units';

        // then
        expect(scaleConfig.toScale().title).toBe('Units');
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('#title should not fire change event when title did not change', () => {

        // given
        scaleConfig.title = 'Units';
        onChangeSpy.mockClear();

        // when
        scaleConfig.title = 'Units';

        // then
        expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('#title should be undefined when emptied', () => {

        // given
        scaleConfig.title = 'Units';

        // when
        scaleConfig.title = '';

        // then
        expect(scaleConfig.title).toBeUndefined();
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
    });

    it('#title should be undefined when blank', () => {

        // when
        scaleConfig.title = '  ';

        // then
        expect(scaleConfig.title).toBeUndefined();
        expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('#title should not fire change event when set undefined', () => {

        // when
        scaleConfig.title = undefined;

        // then
        expect(scaleConfig.title).toBeUndefined();
        expect(onChangeSpy).not.toHaveBeenCalled();
    });
});

describe('ScaleConfig - generic', () => {

    let onChangeSpy: Mock;
    let scaleConfig: ScaleConfig;

    beforeEach(() => {
        onChangeSpy = vi.fn();
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
        vi.mocked(onChangeSpy).mockClear();


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

    it('#title should fire change event', () => {

        // when
        scaleConfig.title = 'Units';

        // then
        expect(scaleConfig.toScale()).toEqual({
            columnName: undefined,
            title: 'Units',
            ticks: {
                stepSize: undefined,
                rotation: undefined
            }
        });
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
    });
});