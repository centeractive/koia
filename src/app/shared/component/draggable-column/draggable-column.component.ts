import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Column, ElementContext, GROUPING_TIME_UNITS, TimeUnit } from 'app/shared/model';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { DataTypeUtils } from 'app/shared/utils';

@Component({
    selector: 'koia-draggable-column',
    templateUrl: './draggable-column.component.html',
    styleUrls: ['./draggable-column.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DraggableColumnComponent implements OnInit {
  @Input() context: ElementContext;
  @Input() column: Column;
  @Input() cssClass: string;

  readonly selectableTimeUnits = GROUPING_TIME_UNITS;

  icon: string;

  ngOnInit(): void {
    this.icon = DataTypeUtils.iconOf(this.column.dataType);
  }

  groupingTimeUnitKey(timeUnit: TimeUnit): string {
    return timeUnit ? EnumLabelKeys.groupingTimeUnit(timeUnit) : 'ui.notGrouped';
  }

  groupingTimeUnitChanged(timeUnit: TimeUnit): void {
    this.column.groupingTimeUnit = timeUnit;
    this.context.fireStructureChanged();
  }
}
