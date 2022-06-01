import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GraphContext } from '../../shared/model';
import { SideBarController } from 'app/shared/controller/side-bar.controller';
import { ColorScheme, ColorUtils, ColorProviderFactory } from 'app/shared/color';

@Component({
  selector: 'koia-graph-side-bar',
  templateUrl: './graph-side-bar.component.html',
  styleUrls: ['./graph-side-bar.component.css']
})
export class GraphSideBarComponent extends SideBarController implements OnChanges {

  @Input() context: GraphContext;

  colorSchemes: ColorScheme[];
  selectedColorScheme: ColorScheme;

  constructor() {
    super();
    this.colorSchemes = ColorUtils.collectAllColorSchemes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.defineSelectedColorScheme()
    this.defineSelectableItems();
  }

  private defineSelectedColorScheme(): void {
    const colorProvider = this.context.colorProvider;
    this.selectedColorScheme = this.colorSchemes
      .find(s => s.type == colorProvider.schemeType && s.scheme == colorProvider.scheme);
  }

  colorSchemeSelectionChanged(): void {
    this.context.colorProvider = ColorProviderFactory.create(this.selectedColorScheme.type, this.selectedColorScheme.scheme);
  }
}
