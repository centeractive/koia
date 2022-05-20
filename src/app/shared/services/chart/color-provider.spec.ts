import { ColorProvider } from './color-provider';

describe('ColorProvider', () => {

    const colorProvider = new ColorProvider();

    it('#bgColors', () => {
        expect(colorProvider.bgColors(2)).toEqual(['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)']);
    });

    it('#bgColors when count exceeds number of available colors', () => {
        const count = colorProvider.defaultColors.length + 1;
        const colors = colorProvider.bgColors(count);

        expect(colors.length).toBe(count);
        expect(colors[0]).toBe('rgba(255, 99, 132, 0.6)');
        expect(colors[count - 1]).toBe('rgba(255, 99, 132, 0.6)');
    });

    it('#bgColorAt', () => {
        expect(colorProvider.bgColorAt(0)).toEqual('rgba(255, 99, 132, 0.6)');
        expect(colorProvider.bgColorAt(1)).toEqual('rgba(54, 162, 235, 0.6)');
    });

    it('#bgColorAt when index exceeds available colors', () => {
        const i = colorProvider.defaultColors.length;

        expect(colorProvider.bgColorAt(i)).toEqual('rgba(255, 99, 132, 0.6)');
        expect(colorProvider.bgColorAt(i + 1)).toEqual('rgba(54, 162, 235, 0.6)');
    });

    it('#borderColors', () => {
        expect(colorProvider.borderColors(2)).toEqual(['rgb(255, 99, 132)', 'rgb(54, 162, 235)']);
    });

    it('#borderColors when count exceeds number of available colors', () => {
        const count = colorProvider.defaultColors.length + 1;
        const colors = colorProvider.borderColors(count);

        expect(colors.length).toBe(count);
        expect(colors[0]).toBe('rgb(255, 99, 132)');
        expect(colors[count - 1]).toBe('rgb(255, 99, 132)');
    });

    it('#borderColorAt', () => {
        expect(colorProvider.borderColorAt(0)).toEqual('rgb(255, 99, 132)');
        expect(colorProvider.borderColorAt(1)).toEqual('rgb(54, 162, 235)');
    });

    it('#borderColorAt when index exceeds available colors', () => {
        const i = colorProvider.defaultColors.length;

        expect(colorProvider.borderColorAt(i)).toEqual('rgb(255, 99, 132)');
        expect(colorProvider.borderColorAt(i + 1)).toEqual('rgb(54, 162, 235)');
    });

});