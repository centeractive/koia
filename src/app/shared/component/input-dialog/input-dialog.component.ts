import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'koia-input-dialog',
  template: `<mat-card>
                <mat-card-subtitle>{{ data.title }}</mat-card-subtitle>
                <mat-card-content>
                  <mat-form-field>
                    <input id="host" matInput type="text" [placeholder]="data.inputName" required
                           maxlength="{{ data.maxLength }}" [(ngModel)]="data.input">
                  </mat-form-field>
                  <div>
                    <button id="but_cancel" mat-raised-button color="primary" (click)="onCancel()">Cancel</button>
                    <button id="but_ok" mat-raised-button color="primary" [disabled]="!data.input" (click)="onOK()">OK</button>
                  </div>
                </mat-card-content>
             </mat-card>`,
  styles: [ `div {
                width: 100%;
                display: flex;
                justify-content: center;
                margin-top: 20px;
             }
             button {
                margin-right: 3px;
                margin-left: 3px;
             }`]
})
export class InputDialogComponent {

  constructor(public dialogRef: MatDialogRef<InputDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: InputDialogData) {
    this.dialogRef.disableClose = true;
  }

  onCancel(): void {
    this.data.closedWithOK = false;
    this.dialogRef.close();
  }

  onOK(): void {
    this.data.closedWithOK = true;
    this.dialogRef.close();
  }
}

export class InputDialogData {

  input: string;
  closedWithOK = false;

  constructor(public readonly title: string, public readonly inputName: string, initialValue: string, public maxLength: number) {
    this.input = initialValue;
  }
}
