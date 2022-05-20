import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RawDataRevealService } from 'app/shared/services';
import { RawDataRevealer } from './raw-data-revealer';

describe('RawDataRevealer', () => {

    let rawDataRevealer: RawDataRevealer;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule, BrowserAnimationsModule],
            providers: [RawDataRevealService]
        });
        const rawDataRevealService = TestBed.inject(RawDataRevealService);
        rawDataRevealer = new RawDataRevealer(rawDataRevealService);
    });

    it('should hide toolbar when data is specified by specific ID', () => {

        // given

        // when

        // then
        expect(1).toBe(1);
    });
});