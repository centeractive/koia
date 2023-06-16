const DIGIT_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function isDigitKey(key: string): boolean {
    return DIGIT_KEYS.includes(key);
}

/** indicates if the specified event was issued by Ctrl+a */
export function isSelectAllEvent(event: KeyboardEvent): boolean {
    return (event.key === 'a' && (event.ctrlKey || event.metaKey));
}

/** indicates if the specified event was issued by Ctrl+c */
export function isCopyEvent(event: KeyboardEvent): boolean {
    return (event.key === 'c' && (event.ctrlKey || event.metaKey));
}

/** indicates if the specified event was issued by Ctrl+x */
export function isCutEvent(event: KeyboardEvent): boolean {
    return (event.key === 'x' && (event.ctrlKey || event.metaKey));
}

/** indicates if the specified event was issued by Ctrl+v */
export function isPasteEvent(event: KeyboardEvent): boolean {
    return (event.key === 'v' && (event.ctrlKey || event.metaKey));
}