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
    'horizontal_bar_chart',
    'linear_bar_chart',
    'linear_horizontal_bar_chart',
    'lucide_baseline',
    'lucide_bold',
    'lucide_chevron_down',
    'lucide_eraser',
    'lucide_italic',
    'lucide_paint_bucket',
    'lucide_text_align_center',
    'lucide_text_align_end',
    'lucide_text_align_start',
    'lucide_trash_2',
    'lucide_underline',
    'move',
    'pivot_table',
    'polar_area_chart',
    'raw_data_view',
    'snap_grid',
    'zoomable_line_chart'
  ];

  constructor(private iconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) { }

  registerSvgIcons(): void {
    this.svgIcons.forEach(icon =>
      this.iconRegistry.addSvgIcon(icon, this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/svg-icons/' + icon + '.svg')));
  }
}
