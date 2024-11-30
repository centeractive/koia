import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CategoricalColorScheme, ColorProviderFactory, ColorOptions, ColorSchemeType, SequentialColorScheme } from 'app/shared/color';
import { ElementContext } from 'app/shared/model';
import * as _ from 'lodash';

@Component({
    selector: 'koia-color-scheme-selection',
    templateUrl: './color-scheme-selection.component.html',
    styleUrls: ['./color-scheme-selection.component.css'],
    standalone: false
})
export class ColorSchemeSelectionComponent implements OnChanges {

  @Input() context: ElementContext;

  categoricalSchemes: CategoricalColorScheme[];
  sequentialSchemes: SequentialColorScheme[];
  colorOptions: ColorOptions;
  imagesDir = '/assets/d3-color-schemes/';

  constructor() {
    this.categoricalSchemes = this.allCategoricalColorSchemes();
    this.sequentialSchemes = this.allSequentialColorSchemes();
  }

  private allCategoricalColorSchemes(): CategoricalColorScheme[] {
    return Object.keys(CategoricalColorScheme)
      .map(key => CategoricalColorScheme[key]);
  }

  private allSequentialColorSchemes(): SequentialColorScheme[] {
    return Object.keys(SequentialColorScheme)
      .map(key => SequentialColorScheme[key]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.colorOptions = _.clone(this.context.colorProvider.options);
  }

  selectCategoricalScheme(scheme: CategoricalColorScheme): void {
    this.colorOptions.type = ColorSchemeType.CATEGORICAL;
    this.colorOptions.scheme = scheme;
    this.changeColorProvider();
  }

  selectSequentialScheme(scheme: SequentialColorScheme): void {
    this.colorOptions.type = ColorSchemeType.SEQUENTIAL;
    this.colorOptions.scheme = scheme;
    this.changeColorProvider();
  }

  changeColorProvider(): void {
    this.context.colorProvider = ColorProviderFactory.create({
      type: this.colorOptions.type,
      scheme: this.colorOptions.scheme,
      bgColorOpacity: this.colorOptions.bgColorOpacity,
      borderColorOpacity: this.colorOptions.borderColorOpacity
    });
  }
}
