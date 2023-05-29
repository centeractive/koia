import { Component, Input, OnInit } from '@angular/core';
import { Column, ElementContext, TimeUnit } from 'app/shared/model';
import { DataTypeUtils } from 'app/shared/utils';

@Component({
  selector: 'koia-draggable-column',
  templateUrl: './draggable-column.component.html',
  styleUrls: ['./draggable-column.component.css']
})
export class DraggableColumnComponent implements OnInit {
  @Input() context: ElementContext;
  @Input() column: Column;
  @Input() cssClass: string;

  readonly selectableTimeUnits = [undefined, TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.DAY, TimeUnit.MONTH, TimeUnit.YEAR];

  icon: string;

  ngOnInit(): void {
    this.icon = DataTypeUtils.iconOf(this.column.dataType);
  }

  groupingTimeUnitChanged(timeUnit: TimeUnit): void {
    this.column.groupingTimeUnit = timeUnit;
    this.context.fireStructureChanged();
  }
}
