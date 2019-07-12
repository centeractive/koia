import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'retro-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerSvgIcon('area_chart');
    this.registerSvgIcon('flex_view');
    this.registerSvgIcon('grid_view');
    this.registerSvgIcon('horizontal_bar_chart');
    this.registerSvgIcon('grouped_bar_chart');
    this.registerSvgIcon('grouped_horizontal_bar_chart');
    this.registerSvgIcon('new_chart');
    this.registerSvgIcon('new_graph');
    this.registerSvgIcon('new_summary_table');
    this.registerSvgIcon('pivot_table');
    this.registerSvgIcon('raw_data_view');
    this.registerSvgIcon('zoomable_line_chart');
  }

  registerSvgIcon(name: string): void {
    this.matIconRegistry.addSvgIcon(name, this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/svg-icons/' + name + '.svg'));
  }
}
