import { ColorConverter } from '.';

describe('ColorConverter', () => {

    it('#hexToRgb', () => {
        expect(ColorConverter.hexToRgb('#ff0')).toEqual('rgb(255,255,0)');
        expect(ColorConverter.hexToRgb('#00ff00')).toEqual('rgb(0,255,0)');
    });

    it('#hexToRgb should throw error when hex color is invalid', () => {
        expect(() => ColorConverter.hexToRgb('#ff00')).toThrow('invalid hex color: #ff00');
    });

    it('#rgbToRgba', () => {
        expect(ColorConverter.rgbToRgba('rgb(0,255,0)', 0.5)).toEqual('rgba(0,255,0,0.5)');
        expect(ColorConverter.rgbToRgba('rgb(120,0,120)', 1)).toEqual('rgba(120,0,120,1)');
    });

    it('#rgbToRgba should render non-number opacity as NaN', () => {

        // given
        const opacity = '1)"><img src=x>' as unknown as number;

        // when
        const rgba = ColorConverter.rgbToRgba('rgb(0,255,0)', opacity);

        // then
        expect(rgba).toEqual('rgba(0,255,0,NaN)');
    });

});