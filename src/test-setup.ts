import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe, LocalizedNumberPipe } from 'app/shared/pipes';
import { installJQueryPlugins, resetTestDoubles } from 'app/shared/test/test-environment';
import { provideTranslateTesting } from 'app/shared/test/translate-testing';

beforeAll(() => installJQueryPlugins(globalThis as unknown as Record<string, unknown>));
beforeEach(() => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']));
beforeEach(() => TestBed.configureTestingModule({
   imports: [TranslatePipe, LocalizedDatePipe, LocalizedNumberPipe],
   providers: [provideTranslateTesting()]
}));
afterEach(resetTestDoubles);
