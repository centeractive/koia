import { ArrayUtils } from 'app/shared/utils';
import { ValueRange } from 'app/shared/value-range/model';
import { ChartData } from 'chart.js';

export class ChartJsUtils {

    static overallXRangeOf(data: ChartData): ValueRange {
        const valueRanges = data.datasets.map(ds => ArrayUtils.numberValueRange(ds.data, 'x'));
        return ArrayUtils.overallValueRange(valueRanges);
    }
}