import { Point } from '@angular/cdk/drag-drop';
import { LanguageService } from 'app/shared/services/language';
import { FreeLayout } from './free-layout';

export type CanvasCommand = 'selectAll' | 'copy' | 'cut' | 'paste' | 'duplicate' | 'toFront' | 'toBack' | 'forward' | 'backward' | 'delete';

interface Shortcut {
  command: CanvasCommand;
  letter: string;
  shift: boolean;
  alt: boolean;
}

/** the shortcuts of draw.io, all with Ctrl (Cmd on macOS) */
const SHORTCUTS: Shortcut[] = [
  { command: 'selectAll', letter: 'a', shift: false, alt: false },
  { command: 'copy', letter: 'c', shift: false, alt: false },
  { command: 'cut', letter: 'x', shift: false, alt: false },
  { command: 'paste', letter: 'v', shift: false, alt: false },
  { command: 'duplicate', letter: 'd', shift: false, alt: false },
  { command: 'toFront', letter: 'f', shift: true, alt: false },
  { command: 'toBack', letter: 'b', shift: true, alt: false },
  { command: 'forward', letter: 'f', shift: true, alt: true },
  { command: 'backward', letter: 'b', shift: true, alt: true }
];

const DELETE_KEYS = ['Delete', 'Backspace'];

const ARROWS: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };

function hasCtrl(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

/**
 * the letter is taken from the key on any keyboard layout, with Alt from the physical key, as Option (macOS) and AltGr change the key
 */
function isLetter(event: KeyboardEvent, shortcut: Shortcut): boolean {
  return shortcut.alt ? event.code === 'Key' + shortcut.letter.toUpperCase() : event.key.toLowerCase() === shortcut.letter;
}

/**
 * @returns the command of the canvas the key stands for, [[undefined]] for other keys
 */
export function commandOf(event: KeyboardEvent): CanvasCommand {
  if (DELETE_KEYS.includes(event.key) && !hasCtrl(event) && !event.shiftKey && !event.altKey) {
    return 'delete';
  }
  return SHORTCUTS.find(s => hasCtrl(event) && event.shiftKey === s.shift && event.altKey === s.alt && isLetter(event, s))?.command;
}

/**
 * @returns the page units an arrow key moves the selected tiles by, larger with Shift, [[undefined]] for other keys
 */
export function nudgeOf(event: KeyboardEvent): Point {
  const direction = ARROWS[event.key];
  if (!direction || hasCtrl(event) || event.altKey) {
    return undefined;
  }
  const step = event.shiftKey ? FreeLayout.STEP : 1;
  return { x: direction.x * step, y: direction.y * step };
}

/**
 * @returns the keys of the shortcut as named on the keyboards of the current language
 */
export function shortcutLabelOf(command: CanvasCommand): string {
  if (command === 'delete') {
    return LanguageService.instant('keys.delete');
  }
  const shortcut = SHORTCUTS.find(s => s.command === command);
  const alt = shortcut.alt && LanguageService.instant('keys.alt');
  const shift = shortcut.shift && LanguageService.instant('keys.shift');
  return [LanguageService.instant('keys.ctrl'), alt, shift, shortcut.letter.toUpperCase()].filter(Boolean).join('+');
}

/**
 * @param content the content of the canvas
 * @returns whether the key is meant for the canvas, neither handled before nor typed into a field or text
 */
export function isCanvasKey(event: KeyboardEvent, content: Element): boolean {
  const focused = document.activeElement;
  if (event.defaultPrevented || (focused !== document.body && !content.contains(focused))) {
    return false;
  }
  const target = event.target;
  return !(target instanceof HTMLElement) || (!target.isContentEditable && !target.closest('input, textarea, select'));
}
