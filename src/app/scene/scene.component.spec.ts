import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';

import { SceneComponent } from './scene.component';
import {
  MatBottomSheetModule, MatBottomSheet, MatProgressBarModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
  MatCardModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatExpansionModule, MatSlideToggleModule, MatMenuModule, MatSelect
} from '@angular/material';
import { NotificationService } from 'app/shared/services';
import { Status, Route } from 'app/shared/model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DBService } from 'app/shared/services/backend';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ReaderService } from 'app/shared/services/reader';
import { HAMMER_LOADER, By } from '@angular/platform-browser';

class FakeNotificationService extends NotificationService {

  constructor() {
    super();
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
  }
}

describe('SceneComponent', () => {

  const datePipe = new DatePipe('en-US');
  const readerService = new ReaderService();
  const dbService = new DBService(null);
  const notificationService = new FakeNotificationService();
  let component: SceneComponent;
  let fixture: ComponentFixture<SceneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SceneComponent],
      imports: [RouterTestingModule, MatBottomSheetModule, MatExpansionModule, MatCardModule, FormsModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatProgressBarModule, MatSlideToggleModule, MatTableModule, MatButtonModule, MatIconModule,
        MatMenuModule, MatTooltipModule, BrowserAnimationsModule],
      providers: [MatBottomSheet,
        { provide: ReaderService, useValue: readerService },
        { provide: DBService, useValue: dbService },
        { provide: NotificationService, useValue: notificationService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(SceneComponent);
    component = fixture.componentInstance;
    spyOn(notificationService, 'onSuccess');
    spyOn(notificationService, 'onWarning');
    spyOn(notificationService, 'onError');
    spyOn(dbService, 'initBackend').and.returnValue(of().toPromise());
    spyOn(dbService, 'findFreeDatabaseName').and.returnValue(of('data_1').toPromise());
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#onFileSelChange should generate scene name and short description', fakeAsync(() => {

    // given
    const fileList = createFileList('dummy data');
    spyOn(readerService, 'readHeader').and.returnValue(Promise.resolve('dummy'));

    // when
    component.onFileSelChange(fileList);
    flush();

    // then
    const expectedName = 'Test / ' + datePipe.transform(fileList[0].lastModified, 'mediumDate');
    expect(component.scene.name).toBe(expectedName);
    const expectedShortDesc = 'CSV Test.csv (modified on ' + datePipe.transform(new Date(), 'medium') + ')';
    expect(component.scene.shortDescription).toBe(expectedShortDesc);
  }));

  it('#click on cancel button should switch to scenes component', () => {

    // given
    spyOn(component.router, 'navigateByUrl');
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_cancel')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
  });

  function createFileList(data: string) {
    const file = new File([data], 'Test.csv');
    return {
      0: file,
      length: 1,
      item: (index: number) => file
    };
  }
});
