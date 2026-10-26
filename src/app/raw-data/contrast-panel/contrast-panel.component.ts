import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ContrastAnalysis } from 'app/shared/services/contrast/contrast.service';
import { ContrastFinding, ValueKind } from 'app/shared/services/contrast/contrast.types';
import { LanguageService } from 'app/shared/services/language';

/**
 * shows the column values that are over-represented among the displayed rows
 */
@Component({
   selector: 'koia-contrast-panel',
   templateUrl: './contrast-panel.component.html',
   styleUrls: ['./contrast-panel.component.css'],
   changeDetection: ChangeDetectionStrategy.Eager,
   standalone: false
})
export class ContrastPanelComponent {

   /**
    * undefined while the analysis is running
    */
   @Input() analysis: ContrastAnalysis;

   @Output() findingClick = new EventEmitter<ContrastFinding>();
   @Output() closePanel = new EventEmitter<void>();

   isClickable(finding: ContrastFinding): boolean {
      return finding.kind === ValueKind.VALUE || finding.kind === ValueKind.EMPTY;
   }

   onFindingClick(finding: ContrastFinding): void {
      if (this.isClickable(finding)) {
         this.findingClick.emit(finding);
      }
   }

   valueLabelOf(finding: ContrastFinding): string {
      return finding.kind === ValueKind.VALUE ? String(finding.value) : LanguageService.instant('contrast.' + finding.kind);
   }

   percentOf(share: number): string {
      return String(Math.round(share * 1000) / 10);
   }

   liftOf(finding: ContrastFinding): string {
      return finding.lift.toFixed(1);
   }

   skippedColumns(): string {
      return this.analysis.skippedColumns.join(', ');
   }
}
