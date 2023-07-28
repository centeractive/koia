import { ColumnPair, DataType } from 'app/shared/model';
import { DateTimeColumnDetector } from './date-time-column-detector';

describe('DateTimeColumnDetector', () => {

    const detector = new DateTimeColumnDetector();

    // TODO: verify if columnPair.target.format should not also include the time-zone?
    it('#generate should detect date/time when value contains time zone', () => {

        // given
        const columnPair: ColumnPair = {
            source: { name: 'X', dataType: DataType.TEXT, width: undefined },
            target: { name: 'X', dataType: DataType.TEXT, width: undefined }
        };

        // when
        detector.detect(columnPair, '01 Jan 1970 00:00:00 GMT', 'en');

        // then
        expect(columnPair.source).toEqual({
            name: 'X', dataType: DataType.TEXT, width: undefined, format: 'd MMM yyyy HH:mm:ss z'
        });
        expect(columnPair.target).toEqual({
            name: 'X', dataType: DataType.TIME, width: undefined, format: 'd MMM yyyy HH:mm:ss'
        });
        expect(columnPair.warning).toBeUndefined();
    });

    /**
    * test for GitHub Issue #19: "Datetime is not right in the preview after file open"
    */
    it('#generate should detect date/time when value contains milliseconds', () => {
        // given
        const columnPair: ColumnPair = {
            source: { name: 'Date', dataType: DataType.TEXT, width: undefined },
            target: { name: 'Date', dataType: DataType.TEXT, width: 23, indexed: true }
        };

        // when
        detector.detect(columnPair, '2022.06.17 14:26:22.123', 'en-US');

        // then
        expect(columnPair.source).toEqual({
            name: 'Date', dataType: DataType.TEXT, width: undefined, format: 'yyyy.MM.dd HH:mm:ss.SSS'
        });
        expect(columnPair.target).toEqual({
            name: 'Date', dataType: DataType.TIME, width: 23, indexed: true, format: 'd MMM yyyy HH:mm:ss SSS'
        });
        expect(columnPair.warning).toBeUndefined();
    })

});