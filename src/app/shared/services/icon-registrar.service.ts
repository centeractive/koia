import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class IconRegistrarService {

  readonly svgIcons = [
    'add_chart',
    'add_summary',
    'area_chart',
    'add_graph',
    'flex_view',
    'grid_view',
    'linear_bar_chart',
    'linear_horizontal_bar_chart',
    'horizontal_bar_chart',
    'pivot_table',
    'polar_area_chart',
    'raw_data_view',
    'zoomable_line_chart'
  ];

  constructor(private iconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) { }

  registerSvgIcons(): void {
    this.svgIcons.forEach(icon =>
      this.iconRegistry.addSvgIcon(icon, this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/svg-icons/' + icon + '.svg')));
  }
}
