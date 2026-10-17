import { DateTime } from 'luxon';
import { TimeFormatter } from './time-formatter';

describe('TimeFormatter', () => {

    const time = 1672583035123;
    const formatter = new class extends TimeFormatter { };

    it('#formatTime', () => {


        expect(formatter.formatTime(time, 'MMM yyyy')).toBe(formatTime('MMM yyyy'));
        expect(formatter.formatTime(time, 'd.M.yyyy HH:mm')).toBe(formatTime('d.M.yyyy HH:mm'));
        expect(formatter.formatTime(time, 'd MMM yyyy HH:mm:ss SSS')).toBe(formatTime('d MMM yyyy HH:mm:ss SSS'));
    });

    it('#formatTime should parse string time', () => {

        // when
        const formatted = formatter.formatTime(String(time), 'd MMM yyyy HH:mm:ss SSS');

        // then
        expect(formatted).toBe(formatTime('d MMM yyyy HH:mm:ss SSS'));
    });

    function formatTime(format: string): string {
        return DateTime.fromMillis(time).toFormat(format)
    }

});