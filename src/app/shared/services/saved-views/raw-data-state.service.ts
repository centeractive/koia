import { Injectable } from '@angular/core';
import { Scene } from '../../model';
import { RawDataState } from '../../model/view-config';
import { DBService } from '../backend';
import type { ComputedColumnChange } from '../computed-column.service';
import { ColumnReferenceUpdater } from '../view-persistence/column-references/column-reference-updater';
import { createDefaultRawDataState } from '../view-persistence/raw-data-state-factory';
import { RawDataStateProvider } from './raw-data-state-provider.type';

/**
 * mediates the state of the raw data tab, which may be applied before its component exists
 */
@Injectable({
   providedIn: 'root'
})
export class RawDataStateService {

   private provider: RawDataStateProvider;
   private pending: { scene: Scene, state: RawDataState };

   constructor(private dbService: DBService) { }

   /**
    * @returns the state applied to the active scene while no provider was registered, the provider must adopt it
    */
   register(provider: RawDataStateProvider): RawDataState | undefined {
      this.provider = provider;
      const state = this.pendingOfActiveScene();
      this.pending = undefined;
      return state;
   }

   unregister(provider: RawDataStateProvider): void {
      if (this.provider === provider) {
         this.provider = undefined;
      }
   }

   current(): RawDataState {
      return this.provider?.rawDataState() ?? this.pendingOfActiveScene() ?? createDefaultRawDataState();
   }

   apply(state: RawDataState): void {
      if (this.provider) {
         this.provider.applyRawDataState(state);
      } else {
         this.pending = { scene: this.dbService.getActiveScene(), state };
      }
   }

   /**
    * renames or removes the column width of the state applied to the active scene while no provider was registered
    */
   updateColumnReferences(change: ComputedColumnChange): void {
      new ColumnReferenceUpdater(change).inWidths(this.pendingOfActiveScene()?.data.columnWidths);
   }

   private pendingOfActiveScene(): RawDataState | undefined {
      return this.pending?.scene === this.dbService.getActiveScene() ? this.pending.state : undefined;
   }
}
