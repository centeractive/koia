import { Scale } from 'app/shared/services/view-persistence';
import * as _ from 'lodash';
import { TicksConfig } from '.';

export class ScaleConfig {

    private readonly _columnName: string;
    private _ticks: TicksConfig;

    constructor(private onChange: () => void, scale: Scale = { ticks: {} }) {
        this._columnName = scale.columnName;
        this._ticks = new TicksConfig(onChange, scale.ticks);
    }

    get columnName(): string {
        return this._columnName;
    }

    get ticks(): TicksConfig {
        return this._ticks;
    }

    set ticks(ticks: TicksConfig) {
        if (!_.isEqual(this._ticks.toTicks(), ticks.toTicks())) {
            this._ticks = ticks;
            this.onChange();
        }
    }

    toScale(): Scale {
        return {
            columnName: this._columnName,
            ticks: this._ticks.toTicks()
        };
    }

    static toScales(configs: ScaleConfig[]): Scale[] {
        if (configs) {
            return configs.map(c => c.toScale());
        }
        return [];
    }
}