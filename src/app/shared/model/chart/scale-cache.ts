import { Scale } from 'app/shared/services/view-persistence';
import * as _ from 'lodash';
import { Column } from '..';

export class ScaleCache {

    private colNamesToScale = new Map<string, Scale>();

    update(scales: Scale[], dataColumns: Column[]): void {
        scales.forEach((s, i) => {
            if (i < dataColumns.length) {
                this.set(dataColumns[i].name, s);
            }
        });
    }

    set(columnName: string, scale: Scale): void {
        this.colNamesToScale.set(columnName, scale);
    }

    get(columnName: string): Scale {
        let scale = this.colNamesToScale.get(columnName);
        if (!scale) {
            scale = {
                columnName,
                ticks: {}
            };
            this.colNamesToScale.set(columnName, scale);
        }
        return _.cloneDeep(scale);
    }

    get size(): number {
        return this.colNamesToScale.size;
    }

}