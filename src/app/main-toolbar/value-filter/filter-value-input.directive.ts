import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NumberUtils, StringUtils } from '../../shared/utils';
import { PropertyFilter, DataType } from 'app/shared/model';
import { ValueFilterCustomizer } from './value-filter-customizer';
import { FilterValueParser } from './filter-value-parser';

/**
 * Responsible for keeping the caret position in place upon insertion and deletion of digits in a value <input> field of a number filter.
 * This is needed because we automatically format numbers by adding and removing thousands separators.
 */
@Directive({
  selector: '[koiaFilterValueInput]'
})
export class FilterValueInputDirective implements OnChanges {

  @Input('koiaFilterValueInput') filter: PropertyFilter;

  private valueFilterCustomizer = new ValueFilterCustomizer();
  private inputElement: HTMLInputElement;
  private valueParser: FilterValueParser;

  constructor(inputElementRef: ElementRef<HTMLInputElement>) {
    this.inputElement = inputElementRef.nativeElement;
    this.inputElement.addEventListener('keydown', e => this.onKeyPressed(e), false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.valueParser = new FilterValueParser(this.filter);
  }

  private onKeyPressed(event: KeyboardEvent): void {
    if (this.filter.dataType === DataType.NUMBER) {
      if (NumberUtils.isNumberKey(event)) {
        this.onNumberKey(event);
      } else if (event.key === 'Delete') {
        this.onDeleteKey();
      } else if (event.key === 'Backspace') {
        this.onBackspaceKey();
      }
    }
  }

  private onNumberKey(event: KeyboardEvent) {
    const selStart = this.inputElement.selectionStart;
    const selEnd = this.inputElement.selectionEnd;
    if (selStart === selEnd) {
      const valueLengthChange = this.onNumberKeyFormattedValue(event).length - this.inputElement.value.length;
      this.setCursorPosition(selStart + valueLengthChange);
    }
  }

  private onNumberKeyFormattedValue(event: KeyboardEvent): string {
    const cursorPos = this.inputElement.selectionStart;
    const value = StringUtils.insertAt(this.inputElement.value, event.key, cursorPos);
    const filterClone = this.filter.clone();
    filterClone.value = this.valueParser.parse(value);
    return this.valueFilterCustomizer.formattedValueOf(filterClone);
  }

  private onDeleteKey() {
    this.setCursorPosition(this.inputElement.selectionStart);
  }

  private onBackspaceKey() {
    let cursorPos = this.inputElement.selectionStart - 1;
    const value = StringUtils.removeCharAt(this.inputElement.value, cursorPos);
    const filterClone = this.filter.clone();
    filterClone.value = this.valueParser.parse(value);
    const formattedValue = this.valueFilterCustomizer.formattedValueOf(filterClone);
    cursorPos -= this.countRemovedThousandSeparatorsLeftToCaret(cursorPos, value, formattedValue);
    this.setCursorPosition(cursorPos);
  }

  private countRemovedThousandSeparatorsLeftToCaret(cursorPos: number, value: string, formattedValue: string): number {
    return StringUtils.occurrences(value.substring(0, cursorPos), NumberUtils.THOUSANDS_SEPARATOR) -
      StringUtils.occurrences(formattedValue.substring(0, cursorPos), NumberUtils.THOUSANDS_SEPARATOR);
  }

  private setCursorPosition(cursorPos: number): void {
    setTimeout(() => this.inputElement.setSelectionRange(cursorPos, cursorPos));
  }
}
