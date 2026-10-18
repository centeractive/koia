import { CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DetachFromDropListDirective } from './detach-from-drop-list.directive';

@Component({
  template: `
    <div cdkDropList>
      <div id="registered" cdkDrag></div>
      <div koiaDetachFromDropList>
        <div id="detached" cdkDrag></div>
      </div>
    </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class HostComponent {
  @ViewChild(CdkDropList) dropList: CdkDropList;
  @ViewChildren(CdkDrag) drags: QueryList<CdkDrag>;
}

describe('DetachFromDropListDirective', () => {

  it('should keep drag inside from registering with enclosing drop list', () => {

    // given
    TestBed.configureTestingModule({
      declarations: [DetachFromDropListDirective, HostComponent],
      imports: [DragDropModule]
    });
    const fixture = TestBed.createComponent(HostComponent);

    // when
    fixture.detectChanges();

    // then
    const [registered, detached] = fixture.componentInstance.drags.toArray();
    expect(registered.element.nativeElement.id).toBe('registered');
    expect(registered.dropContainer).toBe(fixture.componentInstance.dropList);
    expect(detached.element.nativeElement.id).toBe('detached');
    expect(detached.dropContainer).toBeNull();
    expect(fixture.componentInstance.dropList.getSortedItems()).toEqual([registered]);
  });
});
