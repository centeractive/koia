import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ColorProviderFactory, ColorScheme, ColorUtils } from 'app/shared/color';
import { ElementContext } from 'app/shared/model';

@Component({
  selector: 'koia-color-scheme-selection',
  templateUrl: './color-scheme-selection.component.html',
  styleUrls: ['./color-scheme-selection.component.css']
})
export class ColorSchemeSelectionComponent implements OnChanges {

  @Input() context: ElementContext;

  colorSchemes: ColorScheme[];
  selectedColorScheme: ColorScheme;
  imagesDir = '/assets/d3-color-schemes/';

  constructor() {
    this.colorSchemes = ColorUtils.collectAllColorSchemes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.defineSelectedColorScheme();
  }

  private defineSelectedColorScheme(): void {
    const cs = this.context.colorProvider.colorScheme;
    this.selectedColorScheme = this.colorSchemes
      .find(s => s.type == cs.type && s.scheme == cs.scheme);
  }

  selectionChanged(colorScheme: ColorScheme): void {
    this.selectedColorScheme = colorScheme;
    this.context.colorProvider = ColorProviderFactory.create(this.selectedColorScheme);
  }
}
