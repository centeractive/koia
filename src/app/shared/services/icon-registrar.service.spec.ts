import { TestBed } from '@angular/core/testing';

import { IconRegistrarService } from './icon-registrar.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

describe('IconRegistrarService', () => {

  let service: IconRegistrarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconRegistrarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#registerSvgIcons should register icons', () => {

    // given
    const iconRegistry = TestBed.inject(MatIconRegistry);
    vi.spyOn(iconRegistry, 'addSvgIcon').mockReturnValue(undefined);

    // when
    service.registerSvgIcons();

    // then
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledTimes(service.svgIcons.length);
  });

  it('#registerSvgIcons should register snap grid icon from svg icons folder', () => {

    // given
    const iconRegistry = TestBed.inject(MatIconRegistry);
    const sanitizer = TestBed.inject(DomSanitizer);
    vi.spyOn(iconRegistry, 'addSvgIcon').mockReturnValue(undefined);

    // when
    service.registerSvgIcons();

    // then
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledWith('snap_grid',
      sanitizer.bypassSecurityTrustResourceUrl('/assets/svg-icons/snap_grid.svg'));
  });

  it('#registerSvgIcons should register text box toolbar Lucide icons', () => {

    // given
    const iconRegistry = TestBed.inject(MatIconRegistry);
    vi.spyOn(iconRegistry, 'addSvgIcon').mockReturnValue(undefined);

    // when
    service.registerSvgIcons();

    // then
    const registered = vi.mocked(iconRegistry.addSvgIcon).mock.calls.map(c => c[0]).filter(n => n.startsWith('lucide_'));
    expect(registered).toEqual(['lucide_baseline', 'lucide_bold', 'lucide_chevron_down', 'lucide_eraser', 'lucide_italic',
      'lucide_paint_bucket', 'lucide_text_align_center', 'lucide_text_align_end', 'lucide_text_align_start', 'lucide_trash_2',
      'lucide_underline']);
  });

  it('should provide an svg file for each registered icon', async () => {

    // when
    const responses = await Promise.all(service.svgIcons.map(icon => fetch('/assets/svg-icons/' + icon + '.svg')));

    // then
    expect(responses.map(r => r.ok)).toEqual(service.svgIcons.map(() => true));
  });
});
