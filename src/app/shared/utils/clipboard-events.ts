import { StringUtils } from './string-utils';

/** prevents the specified paste event when the value resulting from pasting into the input element is not valid */
export function preventInvalidPaste(event: ClipboardEvent, input: HTMLInputElement, isValid: (value: string) => boolean): void {
    const replacement = event.clipboardData.getData('text/plain');
    const value = StringUtils.replace(input.value, input.selectionStart, input.selectionEnd, replacement).text;
    if (!isValid(value)) {
        event.preventDefault();
    }
}
