import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'koia-confirm-dialog',
  template: `<mat-card>
                <mat-card-subtitle>{{ data.title }}</mat-card-subtitle>
                <mat-card-content>
                  <p *ngFor="let textBlock of data.textBlocks">{{ textBlock }}</p>
                  <div>
                    <button *ngFor="let button of data.buttonNames" mat-raised-button color="primary"
                            (click)="onButtonPressed(button)">{{ button }}</button>
                  </div>
                </mat-card-content>
             </mat-card>`,
  styles: [`
            div {
              width: 100%;
              display: flex;
              justify-content: center;
              margin-top: 20px;
            }
            button {
              margin-right: 5px;
              margin-left: 5px;
            }
          `]
})
export class ConfirmDialogComponent {

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {
    this.dialogRef.disableClose = true;
  }

  onButtonPressed(buttonName: string) {
    this.data.closedWithButtonName = buttonName;
    this.data.closedWithButtonIndex = this.data.buttonNames.indexOf(buttonName);
    this.dialogRef.close();
  }
}

export class ConfirmDialogData {

  static readonly YES_NO = ['Yes', 'No'];

  closedWithButtonIndex: number;
  closedWithButtonName: string;

  constructor(public readonly title: string, public readonly textBlocks: string[], public buttonNames: string[]) { }
}
