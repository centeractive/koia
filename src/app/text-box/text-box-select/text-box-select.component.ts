import { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface SelectOption {
  label: string;
  value: string;
  fontFamily?: string;
}

@Component({
  selector: 'koia-text-box-select',
  templateUrl: './text-box-select.component.html',
  styleUrls: ['../text-box-toolbar/text-box-button.css', './text-box-select.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TextBoxSelectComponent {

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' }
  ];

  @Input() options: SelectOption[];
  @Input() value: string;
  @Input() label: string;
  @Output() selected = new EventEmitter<string>();

  open = false;

  select(option: SelectOption): void {
    this.selected.emit(option.value);
    this.open = false;
  }
}
