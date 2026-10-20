import { RawDataState } from '../../model/view-config';

export interface RawDataStateProvider {
   rawDataState(): RawDataState;
   applyRawDataState(state: RawDataState): void;
}
