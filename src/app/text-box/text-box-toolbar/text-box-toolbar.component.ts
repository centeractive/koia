import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TextBoxEditor } from '../text-box-editor';
import { SelectOption } from '../text-box-select/text-box-select.component';
import {
  BORDER_WIDTHS, colorInputValue, DEFAULT_BACKGROUND_COLOR, DEFAULT_BORDER_COLOR, FONT_FAMILIES, FONT_SIZES, fontFamilyLabel, TextStyleState
} from '../text-box-style';

@Component({
  selector: 'koia-text-box-toolbar',
  templateUrl: './text-box-toolbar.component.html',
  styleUrls: ['./text-box-button.css', './text-box-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TextBoxToolbarComponent {

  readonly FONT_FAMILY_OPTIONS: SelectOption[] = FONT_FAMILIES.map(f => ({ label: f.label, value: f.value, fontFamily: f.value }));
  readonly FONT_SIZE_OPTIONS: SelectOption[] = FONT_SIZES.map(s => ({ label: s, value: s }));
  readonly BORDER_WIDTH_OPTIONS: SelectOption[] = BORDER_WIDTHS.map(w => ({ label: w + 'px', value: '' + w }));
  readonly DEFAULT_BACKGROUND_COLOR = DEFAULT_BACKGROUND_COLOR;
  readonly DEFAULT_BORDER_COLOR = DEFAULT_BORDER_COLOR;
  readonly fontFamilyLabel = fontFamilyLabel;
  readonly colorInputValue = colorInputValue;

  @Input() editor: TextBoxEditor;
  @Input() state: TextStyleState;
  @Input() backgroundColor: string;
  @Output() backgroundColorChange = new EventEmitter<string>();
  @Input() bordered: boolean;
  @Output() borderedChange = new EventEmitter<boolean>();
  @Input() borderWidth: number;
  @Output() borderWidthChange = new EventEmitter<number>();
  @Input() borderColor: string;
  @Output() borderColorChange = new EventEmitter<string>();
  @Output() remove = new EventEmitter<void>();

  colorOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
