import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'koia-input-dialog',
    template: `<mat-card appearance="outlined" koiaForm>
                <mat-card-header>
                  <mat-card-title>{{ data.title }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field>
                    <input id="host" matInput type="text" [placeholder]="data.inputName" required
                           maxlength="{{ data.maxLength }}" [(ngModel)]="data.input">
                  </mat-form-field>
                  <div>
                    <button id="but_cancel" mat-flat-button color="primary" (click)="onCancel()">{{ 'common.cancel' | translate }}</button>
                    <button id="but_ok" mat-flat-button color="primary" [disabled]="!data.input" (click)="onOK()">{{ 'common.ok' | translate }}</button>
                  </div>
                </mat-card-content>
             </mat-card>`,
    styles: [`div {
                width: 100%;
                display: flex;
                justify-content: center;
                margin-top: 20px;
             }
             button {
                margin-right: 3px;
                margin-left: 3px;
             }`],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
