import { Column } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import * as moment from 'moment';

export abstract class TimeFormatter {

    momentFormatOf(timeColumn: Column): string {
        const timeUnit = DateTimeUtils.timeUnitFromNgFormat(timeColumn.format);
        return DateTimeUtils.momentFormatOf(timeUnit);
    }

    formatTime(time: moment.MomentInput, momentFormat: string): string {
        return moment(time).format(momentFormat)
    }
}