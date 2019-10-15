import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'koia-confirm-dialog',
  template: `<mat-card>
                <mat-card-subtitle>{{ data.title }}</mat-card-subtitle>
                <mat-card-content>
                  <div [innerHTML]="data.htmlContent"></div>
                  <div id="div_buttons">
                    <button *ngFor="let button of data.buttonNames" mat-raised-button color="primary"
                            (click)="onButtonPressed(button)">{{ button }}</button>
                  </div>
                  <div id="div_remember" *ngIf="data.letRememberChoice">
                    <mat-checkbox [(ngModel)]="data.rememberChoice">{{ rememberChoiceLabel }}</mat-checkbox>
                  </div>
                </mat-card-content>
             </mat-card>`,
  styles: [`div {
              width: 100%;
            }
            #div_buttons {
              display: flex;
              justify-content: center;
              margin-top: 20px;
            }
            #div_remember {
              display: flex;
              justify-content: center;
            }
            button {
              margin-right: 3px;
              margin-left: 3px;
            }`]
})
export class ConfirmDialogComponent {

  rememberChoiceLabel: string;

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {
    this.dialogRef.disableClose = true;
    this.rememberChoiceLabel = data.buttonNames.length === 1 ? 'Don\'t show again' : 'Remember choice';
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
  rememberChoice = false;

  /**
   * @param title dialog title
   * @param htmlContent HTML formatted content
   * @param buttonNames names of the buttons (custom or predefined ones)
   * @param letRememberChoice determines if a checkbox with label "Remember Choice" appears underneath the buttons
   */
  constructor(public readonly title: string, public readonly htmlContent: string, public buttonNames: string[],
    public letRememberChoice?: boolean) { }
}
