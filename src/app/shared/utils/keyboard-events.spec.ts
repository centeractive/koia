import { isCopyEvent, isCutEvent, isDigitKey, isPasteEvent, isSelectAllEvent } from './keyboard-events';

describe('keyboard-events', () => {

    it('#isDigitKey', () => {
        expect(isDigitKey(' ')).toBe(false);
        expect(isDigitKey('.')).toBe(false);
        expect(isDigitKey('x')).toBe(false);
        expect(isDigitKey('-')).toBe(false);

        for (let k = 0; k <= 9; k++) {
            expect(isDigitKey('' + k)).toBe(true);
        }
    });

    it('#isSelectAllEvent', () => {
        expect(isSelectAllEvent(new KeyboardEvent('keypress', { key: 'a' }))).toBe(false);

        expect(isSelectAllEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'a' }))).toBe(true);
        expect(isSelectAllEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'a' }))).toBe(true);
    });

    it('#isCopyEvent', () => {
        expect(isCopyEvent(new KeyboardEvent('keypress', { key: 'c' }))).toBe(false);

        expect(isCopyEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'c' }))).toBe(true);
        expect(isCopyEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'c' }))).toBe(true);
    });

    it('#isCutEvent', () => {
        expect(isCutEvent(new KeyboardEvent('keypress', { key: 'x' }))).toBe(false);

        expect(isCutEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'x' }))).toBe(true);
        expect(isCutEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'x' }))).toBe(true);
    });

    it('#isPasteEvent', () => {
        expect(isPasteEvent(new KeyboardEvent('keypress', { key: 'v' }))).toBe(false);

        expect(isPasteEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'v' }))).toBe(true);
        expect(isPasteEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'v' }))).toBe(true);
    });

});