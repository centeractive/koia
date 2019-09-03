import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class IconRegistrarService {

  readonly svgIcons = [
    'area_chart',
    'flex_view',
    'grid_view',
    'horizontal_bar_chart',
    'grouped_bar_chart',
    'grouped_horizontal_bar_chart',
    'add_chart',
    'add_graph',
    'add_summary',
    'pivot_table',
    'raw_data_view',
    'zoomable_line_chart'
  ];

  constructor(private iconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) { }

  registerSvgIcons(): void {
    this.svgIcons.forEach(icon =>
      this.iconRegistry.addSvgIcon(icon, this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/svg-icons/' + icon + '.svg')));
  }
}
