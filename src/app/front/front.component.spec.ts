import { async, ComponentFixture, TestBed, flush, fakeAsync, tick } from '@angular/core/testing';

import { FrontComponent } from './front.component';
import {
  MatCardModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatBottomSheet, MatIconModule,
  MatDialogModule,
  MatStepperModule
} from '@angular/material';
import { NotificationService, DialogService } from 'app/shared/services';
import { Status, SceneInfo } from 'app/shared/model';
import { ReaderService } from 'app/shared/services/reader';
import { DBService } from 'app/shared/services/backend';
import { CouchDBService, ConnectionInfo } from 'app/shared/services/backend/couchdb';
import { HAMMER_LOADER } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({ template: '' })
class DummyComponent { }

class FakeNotificationService extends NotificationService {

  constructor() {
    super();
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
  }
}

const readerService = new ReaderService();
const notificationService = new FakeNotificationService();
let couchDBService: CouchDBService;
let dbService: DBService;

describe('FrontComponent', () => {
  let component: FrontComponent;
  let fixture: ComponentFixture<FrontComponent>;

  beforeEach(async(() => {
    spyOn(console, 'log').and.callFake(s => null);
    couchDBService = <CouchDBService> {
      getConnectionInfo(): ConnectionInfo {
        return { host: 'localhost', port: 1234, user: 'koia', password: 'secret' };
      }
    };
    dbService = new DBService(couchDBService);
    TestBed.configureTestingModule({
      declarations: [FrontComponent, DummyComponent],
      imports: [BrowserAnimationsModule, MatCardModule, FormsModule, MatFormFieldModule, MatButtonModule, MatSelectModule, MatIconModule,
        MatDialogModule, MatStepperModule, RouterTestingModule, RouterModule.forRoot([{ path: '**', component: DummyComponent }])
      ],
      providers: [MatBottomSheet,
        { provide: ReaderService, useValue: readerService },
        { provide: DBService, useValue: dbService },
        { provide: CouchDBService, useValue: couchDBService },
        DialogService,
        { provide: NotificationService, useValue: notificationService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(FrontComponent);
    component = fixture.componentInstance;
    component.showScreenshots = false;
    spyOn(dbService, 'initBackend').and.returnValue(Promise.resolve());
    spyOn(dbService, 'usesBrowserStorage').and.returnValue(true);
    const sceneInfos = createSceneInfos(5);
    spyOn(dbService, 'findSceneInfos').and.returnValue(Promise.resolve(sceneInfos));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function createSceneInfos(count: number): SceneInfo[] {
    const sceneInfos: SceneInfo[] = [];
    const now = new Date().getTime();
    for (let i = 0; i < count; i++) {
      sceneInfos.push({ creationTime: now, name: 'abc', shortDescription: 'xyz', database: 'data' });
    }
    return sceneInfos;
  }
});
