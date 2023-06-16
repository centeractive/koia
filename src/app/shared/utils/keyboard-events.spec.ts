import { isCopyEvent, isCutEvent, isDigitKey, isPasteEvent, isSelectAllEvent } from './keyboard-events';

describe('keyboard-events', () => {

    it('#isDigitKey', () => {
        expect(isDigitKey(' ')).toBeFalse();
        expect(isDigitKey('.')).toBeFalse();
        expect(isDigitKey('x')).toBeFalse();
        expect(isDigitKey('-')).toBeFalse();

        for (let k = 0; k <= 9; k++) {
            expect(isDigitKey('' + k)).toBeTrue();
        }
    });

    it('#isSelectAllEvent', () => {
        expect(isSelectAllEvent(new KeyboardEvent('keypress', { key: 'a' }))).toBeFalse();

        expect(isSelectAllEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'a' }))).toBeTrue();
        expect(isSelectAllEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'a' }))).toBeTrue();
    });

    it('#isCopyEvent', () => {
        expect(isCopyEvent(new KeyboardEvent('keypress', { key: 'c' }))).toBeFalse();

        expect(isCopyEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'c' }))).toBeTrue();
        expect(isCopyEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'c' }))).toBeTrue();
    });

    it('#isCutEvent', () => {
        expect(isCutEvent(new KeyboardEvent('keypress', { key: 'x' }))).toBeFalse();

        expect(isCutEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'x' }))).toBeTrue();
        expect(isCutEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'x' }))).toBeTrue();
    });

    it('#isPasteEvent', () => {
        expect(isPasteEvent(new KeyboardEvent('keypress', { key: 'v' }))).toBeFalse();

        expect(isPasteEvent(new KeyboardEvent('keypress', { ctrlKey: true, key: 'v' }))).toBeTrue();
        expect(isPasteEvent(new KeyboardEvent('keypress', { metaKey: true, key: 'v' }))).toBeTrue();
    });

});