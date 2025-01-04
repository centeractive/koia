import { Scale } from 'app/shared/services/view-persistence';
import * as _ from 'lodash';
import { Column } from '..';
import { ScaleConfig } from './scale-config';

export class ScaleRestorer {

    private colNamesToScale = new Map<string, Scale>();

    constructor(private onChange: () => void) { }

    toScaleConfig(scale: Scale): ScaleConfig {
        if (scale) {
            this.set(scale);
            return new ScaleConfig(this.onChange, scale);
        }
        return new ScaleConfig(this.onChange)
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
        return scale ? _.cloneDeep(scale) : this.defaultScale(columnName);
    }

    private defaultScale(columnName?: string): Scale {
        return {
            columnName,
            ticks: {}
        };
    }

    set(scale: Scale): void {
        if (scale.columnName) {
            this.colNamesToScale.set(scale.columnName, scale);
        }
    }

    get size(): number {
        return this.colNamesToScale.size;
    }

}