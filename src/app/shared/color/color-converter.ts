export class ColorConverter {

    static hexToRgb(hex: string): string {
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let digits = hex.substring(1).split('');
            if (digits.length == 3) {
                digits = [digits[0], digits[0], digits[1], digits[1], digits[2], digits[2]];
            }
            const rgb = Number('0x' + digits.join(''));
            return 'rgb(' + [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255].join(',') + ')';
        }
        throw new Error('invalid hex color: ' + hex);
    }

    static rgbToRgba(rgb: string, opacity: number): string {
        return 'rgba' + rgb.slice(3, -1) + ',' + Number(opacity) + ')';
    }
}