import { Scale } from 'app/shared/services/view-persistence';
import * as _ from 'lodash';
import { Column } from '..';
import { ScaleConfig } from './scale-config';

export class ScaleStore {

    private colNamesToScale = new Map<string, Scale>();

    constructor(private onChange: () => void) { }

    toScaleConfig(scale: Scale): ScaleConfig {
        this.set(scale);
        return new ScaleConfig(this.onChange, scale);
    }

    store(scales: ScaleConfig[]): void {
        if (scales) {
            scales.forEach(s => this.set(s.toScale()));
        }
    }

    scaleConfigs(columns: Column[]): ScaleConfig[] {
        if (columns) {
            return columns.map(c => this.scaleConfig(c));
        }
        return [];
    }

    scaleConfig(column?: Column): ScaleConfig {
        if (column) {
            return new ScaleConfig(this.onChange, this.getOrDefault(column.name));
        } else {
            return new ScaleConfig(this.onChange);
        }
    }

    private getOrDefault(columnName: string): Scale {
        let scale = this.colNamesToScale.get(columnName);
        if (scale) {
            return _.cloneDeep(scale);
        }
        return {
            columnName,
            ticks: {}
        };
    }

    set(scale: Scale): void {
        this.colNamesToScale.set(scale.columnName, scale);
    }

    get size(): number {
        return this.colNamesToScale.size;
    }

}