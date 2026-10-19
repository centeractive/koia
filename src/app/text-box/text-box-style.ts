export interface FontFamily {
   label: string;
   value: string;
}

export const FONT_FAMILIES: FontFamily[] = [
   { label: 'Helvetica Neue', value: '"Helvetica Neue", "Lucida Grande", Arial' },
   { label: 'Arial', value: 'Arial, sans-serif' },
   { label: 'Georgia', value: 'Georgia, serif' },
   { label: 'Times New Roman', value: '"Times New Roman", serif' },
   { label: 'Courier New', value: '"Courier New", monospace' },
   { label: 'Verdana', value: 'Verdana, sans-serif' }
];

export const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];

export const DEFAULT_FONT_FAMILY = FONT_FAMILIES[0].value;
export const DEFAULT_FONT_SIZE = '14px';
export const DEFAULT_TEXT_COLOR = '#000000';
export const DEFAULT_BACKGROUND_COLOR = '#ffffff';
export const DEFAULT_BORDER_COLOR = '#e0e0e0';
export const BORDER_WIDTHS = [1, 2, 3, 4, 6];
export const TOOLBAR_HEIGHT_PX = 74;

export type TextAlignment = 'left' | 'center' | 'right';

export const TEXT_ALIGNMENTS: TextAlignment[] = ['left', 'center', 'right'];

export interface TextStyleState {
   bold: boolean;
   italic: boolean;
   underline: boolean;
   fontFamily: string;
   fontSize: string;
   color: string;
   textAlign: TextAlignment;
}

export function fontFamilyLabel(value: string): string {
   const fontFamily = FONT_FAMILIES.find(f => f.value === value);
   return fontFamily ? fontFamily.label : value.split(',')[0].replace(/["']/g, '').trim();
}

/**
 * @returns the #rrggbb part of a #rrggbb or #rrggbbaa colour as needed by a colour input, the fallback otherwise
 */
export function colorInputValue(color: string, fallback: string): string {
   return /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(color ?? '') ? color.slice(0, 7) : fallback;
}

export function toHexColor(value: string): string {
   if (/^#[0-9a-f]{6}$/i.test(value ?? '')) {
      return value;
   }
   const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(value ?? '');
   if (rgb) {
      return '#' + rgb.slice(1).map(c => Number(c).toString(16).padStart(2, '0')).join('');
   }
   return DEFAULT_TEXT_COLOR;
}
