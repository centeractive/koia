import { preventInvalidPaste } from './clipboard-events';

describe('clipboard-events', () => {

    const isDigits = (value: string) => /^\d+$/.test(value);
    let input: HTMLInputElement;

    beforeEach(() => {
        input = document.createElement('input');
        document.body.appendChild(input);
    });

    afterEach(() => input.remove());

    it('#preventInvalidPaste should prevent paste of invalid value', () => {

        // given
        const event = pasteEvent('1x');

        // when
        preventInvalidPaste(event, input, isDigits);

        // then
        expect(event.defaultPrevented).toBe(true);
    });

    it('#preventInvalidPaste should accept valid value', () => {

        // given
        const event = pasteEvent('12');

        // when
        preventInvalidPaste(event, input, isDigits);

        // then
        expect(event.defaultPrevented).toBe(false);
    });

    it('#preventInvalidPaste should validate value composed with selection', () => {

        // given
        input.value = '1ab4';
        input.setSelectionRange(1, 3);
        const event = pasteEvent('23');
        const isValid = vi.fn().mockReturnValue(true);

        // when
        preventInvalidPaste(event, input, isValid);

        // then
        expect(isValid).toHaveBeenCalledWith('1234');
        expect(event.defaultPrevented).toBe(false);
    });

    function pasteEvent(text: string): ClipboardEvent {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        return new ClipboardEvent('paste', { clipboardData, cancelable: true });
    }
});
