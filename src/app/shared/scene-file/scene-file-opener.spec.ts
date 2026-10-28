import { DefaultUrlSerializer, Router } from '@angular/router';
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
  let router: { url: string, parseUrl: (url: string) => unknown, navigateByUrl: Mock, routeReuseStrategy: AppRouteReuseStrategy };
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
    router = { url: '/front', parseUrl: url => new DefaultUrlSerializer().parse(url), navigateByUrl: navigateSpy, routeReuseStrategy };
    opener = new SceneFileOpener({ import: importSpy } as unknown as SceneFileService, router as unknown as Router,
      notifier as unknown as AbstractComponent);
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

  it('#open from cached page should leave it before clearing cached views and showing raw data', async () => {

    // given
    router.url = '/rawdata';
    importSpy.mockResolvedValue(undefined);

    // when
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalledTimes(2));

    // then
    expect(navigateSpy.mock.calls).toEqual([[Route.SCENES, { skipLocationChange: true }], [Route.RAWDATA]]);
    const clearOrder = vi.mocked(routeReuseStrategy.clear).mock.invocationCallOrder[0];
    expect(navigateSpy.mock.invocationCallOrder[0]).toBeLessThan(clearOrder);
    expect(clearOrder).toBeLessThan(navigateSpy.mock.invocationCallOrder[1]);
  });

  it('#open from page that is not cached should show raw data without leaving it', async () => {

    // given
    importSpy.mockResolvedValue(undefined);

    // when
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalled());

    // then
    expect(navigateSpy.mock.calls).toEqual([[Route.RAWDATA]]);
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

  it('#cancel should still show raw data when import completes after last abort check', async () => {

    // given
    let completeImport: () => void;
    importSpy.mockReturnValue(new Promise<void>(resolve => completeImport = resolve));
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    opener.cancel();
    completeImport();

    // then
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalledWith(Route.RAWDATA));
  });

  it('#destroy should abort running import', async () => {

    // given
    importSpy.mockReturnValue(new Promise(() => undefined));
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    opener.destroy();

    // then
    expect(importSpy.mock.calls[0][1].aborted).toBe(true);
  });

  it('#destroy should not show raw data when import completes after destroy', async () => {

    // given
    let completeImport: () => void;
    importSpy.mockReturnValue(new Promise<void>(resolve => completeImport = resolve));
    selectFile(input, new File(['x'], 'sales.koia'));
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());

    // when
    opener.destroy();
    completeImport();
    await vi.waitFor(() => expect(routeReuseStrategy.clear).toHaveBeenCalled());

    // then
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('#destroy should not fail when no import runs', () => {

    // when
    const destroy = () => opener.destroy();

    // then
    expect(destroy).not.toThrow();
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

  it('#select should open file selection without showing progress', () => {

    // given
    const clickSpy = vi.spyOn(input, 'click').mockReturnValue(undefined);

    // when
    opener.select(input);

    // then
    expect(clickSpy).toHaveBeenCalled();
    expect(opener.importing).toBe(false);
  });

  it('#selectOrCancel should select file when no import is cancelable', () => {

    // given
    const clickSpy = vi.spyOn(input, 'click').mockReturnValue(undefined);

    // when
    opener.selectOrCancel(input);

    // then
    expect(clickSpy).toHaveBeenCalled();
  });

  it('#selectOrCancel should cancel cancelable import', async () => {

    // given
    importSpy.mockReturnValue(new Promise(() => undefined));
    selectFile(input, new File(['x'], 'sales.koia'));
    const clickSpy = vi.spyOn(input, 'click').mockReturnValue(undefined);

    // when
    opener.selectOrCancel(input);

    // then
    expect(opener.cancelable).toBe(false);
    expect(clickSpy).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());
  });

  it('#icon should show open icon when idle and spinner while importing', () => {

    // when
    const idle = opener.icon;
    opener.importing = true;

    // then
    expect([idle, opener.icon]).toEqual(['file_open', 'autorenew']);
  });

  it('#labelKey should name opening while importing', () => {

    // when
    const idle = opener.labelKey;
    opener.importing = true;

    // then
    expect([idle, opener.labelKey]).toEqual(['front.actions.openSceneFile', 'front.actions.openingSceneFile']);
  });

  it('#tooltipKey should offer cancel while import is cancelable', async () => {

    // given
    importSpy.mockReturnValue(new Promise(() => undefined));

    // when
    selectFile(input, new File(['x'], 'sales.koia'));

    // then
    expect(opener.tooltipKey).toBe('common.cancel');
    opener.cancel();
    expect(opener.tooltipKey).toBe('front.actions.openingSceneFile');
    await vi.waitFor(() => expect(importSpy).toHaveBeenCalled());
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
