import { ColumnPair, DataType, TimeUnit } from 'app/shared/model';
import { DateTimeUtils } from 'app/shared/utils';
import { DateTimeColumnDetector } from './date-time-column-detector';

describe('DateTimeColumnDetector', () => {

    const detector = new DateTimeColumnDetector();

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

    it('#detect should detect date of locale with language and country', () => {

        // given
        const columnPair: ColumnPair = {
            source: { name: 'Date', dataType: DataType.TEXT, width: undefined },
            target: { name: 'Date', dataType: DataType.TEXT, width: undefined }
        };

        // when
        detector.detect(columnPair, '15.03.2024', 'de-CH');

        // then
        expect(columnPair.source.format).toBe('dd.MM.yyyy');
        expect(columnPair.target.dataType).toBe(DataType.TIME);
    });

function textColumnPair(): ColumnPair {
        return {
            source: { name: 'Time', dataType: DataType.TEXT, width: undefined },
            target: { name: 'Time', dataType: DataType.TEXT, width: undefined }
        };
    }

    it.each([
        ['2024-01-01T10:00:00.123Z', TimeUnit.MILLISECOND],
        ['2024-01-01T10:00:00.123+01:00', TimeUnit.MILLISECOND],
        ['2024-01-01T10:00:00.123456+01:00', TimeUnit.MILLISECOND],
        ['2024-01-01T10:00:00,123Z', TimeUnit.MILLISECOND],
        ['2024-01-01T10:00:00Z', TimeUnit.SECOND],
        ['2024-01-01T10:00+01:00', TimeUnit.SECOND]
    ])('#detect should detect ISO date/time %s without source format', (value, timeUnit) => {

        // given
        const columnPair = textColumnPair();

        // when
        detector.detect(columnPair, value, 'en-US');

        // then
        expect(columnPair.source.format).toBeUndefined();
        expect(columnPair.target.dataType).toBe(DataType.TIME);
        expect(columnPair.target.format).toBe(DateTimeUtils.ngFormatOf(timeUnit));
    });

    it('#detect should not detect ISO date without time', () => {

        // given
        const columnPair = textColumnPair();

        // when
        detector.detect(columnPair, '2024-01-01T', 'en-US');

        // then
        expect(columnPair.target.dataType).toBe(DataType.TEXT);
        expect(columnPair.target.format).toBeUndefined();
    });

    it('#detect should not detect invalid ISO date/time', () => {

        // given
        const columnPair = textColumnPair();

        // when
        detector.detect(columnPair, '2024-13-45T10:00:00Z', 'en-US');

        // then
        expect(columnPair.target.dataType).toBe(DataType.TEXT);
    });

    it('#detect should keep source format of date/time with space detected so far', () => {

        // given
        const columnPair = textColumnPair();

        // when
        detector.detect(columnPair, '2024-01-01 10:00:00,123', 'en-US');

        // then
        expect(columnPair.source.format).toBe('yyyy-MM-dd HH:mm:ss,SSS');
        expect(columnPair.target.dataType).toBe(DataType.TIME);
    });
});

