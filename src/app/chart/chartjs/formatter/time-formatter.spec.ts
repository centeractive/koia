import { TimeFormatter } from './time-formatter';

describe('TimeFormatter', () => {

    const formatter = new class extends TimeFormatter { };

    it('#formatTime', () => {
        const time = 1672583035123;

        expect(formatter.formatTime(time, 'MMM yyyy')).toBe('Jan 2023');
        expect(formatter.formatTime(time, 'd.M.yyyy HH:mm')).toBe('1.1.2023 15:23');
        expect(formatter.formatTime(time, 'd MMM yyyy HH:mm:ss SSS')).toBe('1 Jan 2023 15:23:55 123');
    });

});