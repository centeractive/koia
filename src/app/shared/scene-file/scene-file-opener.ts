import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { AbstractComponent } from 'app/shared/component/abstract.component';
import { Route } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';
import { CommonUtils } from 'app/shared/utils';
import { SCENE_FILE_EXTENSION } from './scene-file';
import { SceneFileService } from './scene-file.service';

/**
 * opens the .koia file selected in a file input as new scene and shows its raw data, the import can be canceled
 */
export class SceneFileOpener {

  readonly extension = SCENE_FILE_EXTENSION;
  importing = false;
  private sceneFileImport: AbortController;
  private destroyed = false;

  constructor(private sceneFileService: SceneFileService, private router: Router, private notifier: AbstractComponent) { }

  /**
   * true while an import runs that was not canceled yet
   */
  get cancelable(): boolean {
    return !!this.sceneFileImport && !this.sceneFileImport.signal.aborted;
  }

  get icon(): string {
    return this.importing ? 'autorenew' : 'file_open';
  }

  get labelKey(): string {
    return this.importing ? 'front.actions.openingSceneFile' : 'front.actions.openSceneFile';
  }

  get tooltipKey(): string {
    return this.cancelable ? 'common.cancel' : this.labelKey;
  }

  /**
   * opens the file selection of the input unless an import runs
   */
  select(input: HTMLInputElement): void {
    if (!this.importing) {
      input.click();
    }
  }

  selectOrCancel(input: HTMLInputElement): void {
    if (this.cancelable) {
      this.cancel();
    } else {
      this.select(input);
    }
  }

  /**
   * inserts the scene of the selected .koia file as new scene and shows its raw data
   */
  open(input: HTMLInputElement): void {
    const file = input.files[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.importing = true;
    const sceneFileImport = this.sceneFileImport = new AbortController();
    CommonUtils.afterNextPaint()
      .then(() => this.sceneFileService.import(file, sceneFileImport.signal))
      .then(() => this.showRawData())
      .catch(err => {
        this.importing = false;
        this.sceneFileImport = undefined;
        if (sceneFileImport.signal.aborted) {
          this.notifier.notifyWarning(LanguageService.instant('sceneFile.importCanceled'));
        } else {
          this.notifier.notifyError(err);
        }
      });
  }

  /**
   * a cached page is left before the cache is cleared, otherwise it would be cached again with the views of the previous
   * scene, and raw data would not be recreated when it is the current page
   */
  private showRawData(): Promise<boolean> {
    const routeReuseStrategy = this.router.routeReuseStrategy as AppRouteReuseStrategy;
    if (this.destroyed) {
      routeReuseStrategy.clear();
      return Promise.resolve(false);
    }
    const leaveCachedPage = routeReuseStrategy.isCached(this.router.parseUrl(this.router.url))
      ? this.router.navigateByUrl(Route.SCENES, { skipLocationChange: true })
      : Promise.resolve(true);
    return leaveCachedPage.then(() => {
      routeReuseStrategy.clear();
      return this.router.navigateByUrl(Route.RAWDATA);
    });
  }

  /**
   * aborts the running import, the partially inserted scene is deleted
   */
  cancel(): void {
    this.sceneFileImport.abort();
  }

  /**
   * aborts the running import when the page of this opener is left, a completed import no longer shows its raw data
   */
  destroy(): void {
    this.destroyed = true;
    this.sceneFileImport?.abort();
  }
}
