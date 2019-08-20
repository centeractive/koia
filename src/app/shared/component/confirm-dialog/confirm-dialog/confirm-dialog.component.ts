import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'koia-confirm-dialog',
  template: `<mat-card>
                <mat-card-subtitle>{{ data.title }}</mat-card-subtitle>
                <mat-card-content>
                  <p *ngFor="let textBlock of data.textBlocks" [innerHTML]="textBlock"></p>
                  <div id="div_buttons">
                    <button *ngFor="let button of data.buttonNames" mat-raised-button color="primary"
                            (click)="onButtonPressed(button)">{{ button }}</button>
                  </div>
                  <div *ngIf="data.letRememberChoice">
                    <mat-checkbox [(ngModel)]="data.rememberChoice">Remember Choice</mat-checkbox>
                  </div>
                </mat-card-content>
             </mat-card>`,
  styles: [`div {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            #div_buttons {
              margin-top: 20px;
            }
            button {
              margin-right: 3px;
              margin-left: 3px;
            }`]
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
  rememberChoice: boolean;

  /**
   * @param title dialog title
   * @param textBlocks one or more text blocks (use "<br>" inside text blocks for newline)
   * @param buttonNames names of the buttons (custom or predefined ones)
   * @param letRememberChoice determines if a checkbox with label "Remember Choice" appears underneath the buttons
   */
  constructor(public readonly title: string, public readonly textBlocks: string[], public buttonNames: string[],
    public letRememberChoice?: boolean) { }
}
