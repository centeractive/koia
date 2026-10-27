import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { Route } from 'app/shared/model';
import { selectFile } from 'app/shared/test';
import type { Mock } from 'vitest';
import { SceneFileOpener } from './scene-file-opener';
import { SceneFileService } from './scene-file.service';

describe('SceneFileOpener', () => {

  let importSpy: Mock;
  let routeReuseStrategy: AppRouteReuseStrategy;
  let navigateSpy: Mock;
  let notifier: { notifyWarning: Mock, notifyError: Mock };
  let input: HTMLInputElement;
  let opener: SceneFileOpener;

  beforeEach(() => {
    importSpy = vi.fn();
    routeReuseStrategy = new AppRouteReuseStrategy();
    vi.spyOn(routeReuseStrategy, 'clear').mockReturnValue(undefined);
    navigateSpy = vi.fn().mockResolvedValue(true);
    notifier = { notifyWarning: vi.fn(), notifyError: vi.fn() };
    input = document.createElement('input');
    input.type = 'file';
    opener = new SceneFileOpener({ import: importSpy } as unknown as SceneFileService,
      { navigateByUrl: navigateSpy, routeReuseStrategy } as unknown as Router, notifier as unknown as AbstractComponent);
    input.addEventListener('change', () => opener.open(input));
  });

  function rejectOnAbort(): void {
    importSpy.mockImplementation((_file: File, signal: AbortSignal) =>
      new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))));
  }

  it('#open should import selected file after next paint, clear cached views and show its raw data', async () => {

    // given
    importSpy.mockResolvedValue(undefined);
    const file = new File(['x'], 'sales.koia');

    // when
    selectFile(input, file);

    // then
    expect(importSpy).not.toHaveBeenCalled();
    expect(opener.importing).toBe(true);
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalledWith(Route.RAWDATA));
    expect(importSpy).toHaveBeenCalledWith(file, expect.any(AbortSignal));
    expect(routeReuseStrategy.clear).toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('#open should ignore input without file', () => {

    // when
    opener.open(input);

    // then
    expect(importSpy).not.toHaveBeenCalled();
    expect(opener.importing).toBe(false);
  });

  it('#open should notify error and stop importing when import fails', async () => {

    // given
    importSpy.mockRejectedValue('sales.koia is not a Koia scene file');

    // when
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(notifier.notifyError).toHaveBeenCalled());

    // then
    expect(notifier.notifyError).toHaveBeenCalledWith('sales.koia is not a Koia scene file');
    expect(notifier.notifyWarning).not.toHaveBeenCalled();
    expect(opener.importing).toBe(false);
    expect(opener.cancelable).toBe(false);
  });

  it('#cancel should abort import, warn and stop importing', async () => {

    // given
    rejectOnAbort();
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    opener.cancel();
    await vi.waitFor(() => expect(notifier.notifyWarning).toHaveBeenCalled());

    // then
    expect(notifier.notifyWarning).toHaveBeenCalledWith('Opening the shared scene was canceled');
    expect(notifier.notifyError).not.toHaveBeenCalled();
    expect(opener.importing).toBe(false);
  });

  it('#cancelable should be true while import runs', async () => {

    // given
    importSpy.mockReturnValue(new Promise(() => undefined));

    // when
    selectFile(input, new File(['x'], 'sales.koia'));

    // then
    expect(opener.cancelable).toBe(true);
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());
  });

  it('#cancelable should be false once canceled while import still runs', async () => {

    // given
    importSpy.mockReturnValue(new Promise(() => undefined));
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    opener.cancel();

    // then
    expect(opener.cancelable).toBe(false);
    expect(opener.importing).toBe(true);
  });

  it('#cancelable should be false when no import runs', () => {
    expect(opener.cancelable).toBe(false);
  });

  it('#select should open file selection when no import runs', () => {

    // given
    const clickSpy = vi.spyOn(input, 'click').mockReturnValue(undefined);

    // when
    opener.select(input);

    // then
    expect(clickSpy).toHaveBeenCalled();
  });

  it('#select should not open file selection while importing', async () => {

    // given
    importSpy.mockReturnValue(new Promise(() => undefined));
    selectFile(input, new File(['x'], 'sales.koia'));
    const clickSpy = vi.spyOn(input, 'click').mockReturnValue(undefined);

    // when
    opener.select(input);

    // then
    expect(clickSpy).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());
  });
});
