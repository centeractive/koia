import { TestBed } from '@angular/core/testing';

import { DialogService } from './dialog.service';
import { MatDialogModule, MatDialog } from '@angular/material';

describe('DialogService', () => {

  beforeEach(() => TestBed.configureTestingModule({
    imports: [MatDialogModule],
    providers: [MatDialog]
  }));

  it('should be created', () => {
    const service: DialogService = TestBed.get(DialogService);
    expect(service).toBeTruthy();
  });
});
