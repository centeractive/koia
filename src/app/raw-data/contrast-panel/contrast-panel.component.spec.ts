import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContrastAnalysis } from 'app/shared/services/contrast/contrast.service';
import { ContrastFinding, ValueKind } from 'app/shared/services/contrast/contrast.types';
import { ContrastPanelComponent } from './contrast-panel.component';

describe('ContrastPanelComponent', () => {

   let fixture: ComponentFixture<ContrastPanelComponent>;
   let component: ContrastPanelComponent;

   beforeEach(() => {
      TestBed.configureTestingModule({
         declarations: [ContrastPanelComponent],
         imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule]
      });
      fixture = TestBed.createComponent(ContrastPanelComponent);
      component = fixture.componentInstance;
   });

   function finding(props: Partial<ContrastFinding>): ContrastFinding {
      return {
         column: 'Host', kind: ValueKind.VALUE, value: 'node-7', selectedCount: 60, selectedShare: 0.6, restShare: 0.05,
         lift: 11.849, z: 20, isNew: false, ...props
      };
   }

   function render(analysis: ContrastAnalysis): HTMLElement {
      fixture.componentRef.setInput('analysis', analysis);
      fixture.detectChanges();
      return fixture.nativeElement;
   }

   function findingButtons(host: HTMLElement): HTMLButtonElement[] {
      return Array.from(host.querySelectorAll<HTMLButtonElement>('.contrast-finding'));
   }

   it('should show progress while analysis is running', () => {

      // when
      const host = render(undefined);

      // then
      expect(host.querySelector('mat-progress-bar')).not.toBeNull();
      expect(host.querySelector('.contrast-message')).toBeNull();
   });

   it('should show message when rows are not comparable', () => {

      // when
      const host = render({ comparable: false, findings: [], skippedColumns: [] });

      // then
      expect(host.querySelector('.contrast-message').textContent).toContain('nothing to compare');
      expect(host.querySelector('mat-progress-bar')).toBeNull();
   });

   it('should show message when there are no findings', () => {

      // when
      const host = render({ comparable: true, findings: [], skippedColumns: [] });

      // then
      expect(host.querySelector('.contrast-message').textContent).toContain('No column value is clearly over-represented');
   });

   it('should show findings with shares and lift', () => {

      // when
      const host = render({ comparable: true, findings: [finding({})], skippedColumns: [] });

      // then
      const [button] = findingButtons(host);
      expect(button.querySelector('.contrast-condition').textContent).toBe('Host = node-7');
      expect(button.querySelector('.contrast-share').textContent).toBe('60% here · 5% elsewhere');
      expect(button.querySelector('.contrast-lift').textContent).toBe('×11.8');
      expect(button.querySelector('.contrast-new')).toBeNull();
      expect(button.disabled).toBe(false);
   });

   it('should mark new value instead of showing lift', () => {

      // when
      const host = render({ comparable: true, findings: [finding({ isNew: true, restShare: 0 })], skippedColumns: [] });

      // then
      const [button] = findingButtons(host);
      expect(button.querySelector('.contrast-new').textContent).toBe('new');
      expect(button.querySelector('.contrast-lift')).toBeNull();
      expect(button.querySelector('.contrast-share').textContent).toBe('60% here · 0% elsewhere');
   });

   it('should show shares with one decimal', () => {

      // when
      const host = render({ comparable: true, findings: [finding({ selectedShare: 0.12345, restShare: 0.0004 })], skippedColumns: [] });

      // then
      expect(findingButtons(host)[0].querySelector('.contrast-share').textContent).toBe('12.3% here · 0% elsewhere');
   });

   it('should label empty, null and blank values', () => {

      // given
      const findings = [ValueKind.EMPTY, ValueKind.NULL, ValueKind.BLANK].map(kind => finding({ kind, value: undefined }));

      // when
      const host = render({ comparable: true, findings, skippedColumns: [] });

      // then
      expect(findingButtons(host).map(b => b.querySelector('.contrast-condition').textContent))
         .toEqual(['Host = (empty)', 'Host = (null)', 'Host = ("")']);
   });

   it('should emit clicked finding of value or missing value', () => {

      // given
      const findings = [finding({}), finding({ kind: ValueKind.EMPTY, value: undefined })];
      const emitted: ContrastFinding[] = [];
      component.findingClick.subscribe(f => emitted.push(f));
      const host = render({ comparable: true, findings, skippedColumns: [] });

      // when
      findingButtons(host).forEach(b => b.click());

      // then
      expect(emitted).toEqual(findings);
   });

   it('should not emit finding of null or blank value', () => {

      // given
      const findings = [finding({ kind: ValueKind.NULL, value: undefined }), finding({ kind: ValueKind.BLANK, value: undefined })];
      const emitted: ContrastFinding[] = [];
      component.findingClick.subscribe(f => emitted.push(f));
      const host = render({ comparable: true, findings, skippedColumns: [] });

      // when
      findingButtons(host).forEach(b => b.click());
      findings.forEach(f => component.onFindingClick(f));

      // then
      expect(findingButtons(host).map(b => b.disabled)).toEqual([true, true]);
      expect(emitted).toEqual([]);
   });

   it('should name skipped columns', () => {

      // when
      const host = render({ comparable: true, findings: [finding({})], skippedColumns: ['Message', 'Path'] });

      // then
      expect(host.querySelector('.contrast-skipped').textContent).toContain('too many different values: Message, Path');
   });

   it('should emit close when close button is clicked', () => {

      // given
      let closed = false;
      component.closePanel.subscribe(() => closed = true);
      const host = render({ comparable: true, findings: [], skippedColumns: [] });

      // when
      (host.querySelector('.contrast-close') as HTMLButtonElement).click();

      // then
      expect(closed).toBe(true);
   });
});
