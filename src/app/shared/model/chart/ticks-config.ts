import { Ticks } from 'app/shared/services/view-persistence';

export class TicksConfig {

    private _stepSize: number; // linear axes specific tick option
    private _rotation: number; // cartesian axes specific tick option

    constructor(private onChange: () => void, ticks: Ticks = {}) {
        this._stepSize = ticks.stepSize;
        this._rotation = ticks.rotation;
    }

    get stepSize(): number {
        return this._stepSize;
    }

    set stepSize(stepSize: number) {
        if (this._stepSize !== stepSize) {
            this._stepSize = stepSize;
            this.onChange();
        }
    }

    get rotation(): number {
        return this._rotation;
    }

    set rotation(rotation: number) {
        if (this._rotation !== rotation) {
            this._rotation = rotation;
            this.onChange();
        }
    }

    toTicks(): Ticks {
        return {
            stepSize: this._stepSize,
            rotation: this._rotation
        };
    }

}