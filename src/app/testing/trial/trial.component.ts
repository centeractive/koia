import { Component } from '@angular/core';

@Component({
  selector: 'koia-trial',
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css']
})
export class TrialComponent {

  vFloadField: number;
  vTextArea: string;

  logData = '';

  log(subject: string, value: string): void {
    console.log(subject, value);
    this.logData = subject + '\t' + value + '\n' + this.logData;
  }
}
