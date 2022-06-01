export class ColorConverter {

    static hexToRgb(hex: string): string {
        let rgb: any;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            rgb = hex.substring(1).split('');
            if (rgb.length == 3) {
                rgb = [rgb[0], rgb[0], rgb[1], rgb[1], rgb[2], rgb[2]];
            }
            rgb = '0x' + rgb.join('');
            return 'rgb(' + [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255].join(',') + ')';
        }
        throw new Error('invalid hex color: ' + hex);
    }

    static rgbToRgba(rgb: string, opacity: number): string {
        return 'rgba' + rgb.slice(3, -1) + ',' + opacity + ')';
    }
}