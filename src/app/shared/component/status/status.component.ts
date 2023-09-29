import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Status } from '../../model';

@Component({
  selector: 'koia-status',
  template: '<div *ngIf="status" [class]="status.type">{{ status.msg }}</div>',
  styleUrls: ['./status.component.css']
})
export class StatusComponent {

  status: Status;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any) {
    this.status = this.data.status;
  }
}
