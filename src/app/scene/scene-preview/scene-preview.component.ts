import { ChangeDetectionStrategy, Component, DoCheck, Input, OnChanges } from '@angular/core';
import { Column, ColumnPair } from 'app/shared/model';
import { ColumnWidthResolver } from 'app/shared/ui/virtual-table/column-width-resolver';
import { ColumnResize, VirtualTableSource } from 'app/shared/ui/virtual-table/virtual-table-source';
import { MappingResult } from '../column-mapping/mapper';

@Component({
  selector: 'koia-scene-preview',
  templateUrl: './scene-preview.component.html',
  styleUrls: ['./scene-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ScenePreviewComponent implements OnChanges, DoCheck {

  @Input() columnPairs: ColumnPair[];
  @Input() mappingResults: MappingResult[];

  columns: Column[];
  widths: number[];
  source: VirtualTableSource;
  multiLine = false;
  showNestedObjects = false;

  private entries: object[];
  private widthsKey: string;
  private readonly widthResolver = new ColumnWidthResolver();

  ngOnChanges(): void {
    this.columns = this.columnPairs.filter(cp => !cp.skip).map(cp => cp.target);
    const entries = this.mappingResults.map(mr => mr.entry ?? {});
    this.entries = entries;
    this.source = { rowCount: () => entries.length, rowAt: index => entries[index], requestRange: () => undefined };
    this.widthsKey = undefined;
  }

  ngDoCheck(): void {
    const key = this.columns.map(c => c.width).join();
    if (key !== this.widthsKey) {
      this.widthsKey = key;
      this.widths = this.columns.map(c => this.widthResolver.widthOf(c, 'em', true, this.entries, this.showNestedObjects));
    }
  }

  toggleShowNestedObjects(): void {
    this.showNestedObjects = !this.showNestedObjects;
    this.widthsKey = undefined;
  }

  onColumnResize(resize: ColumnResize): void {
    this.columns[resize.index].width = this.widthResolver.charsOf(resize.width);
  }

  errorsOf(index: number): string {
    return this.mappingResults[index].errors.join('\n');
  }
}
