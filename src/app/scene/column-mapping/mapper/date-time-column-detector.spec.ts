import { ColumnPair, DataType } from 'app/shared/model';
import { DateTimeColumnDetector } from './date-time-column-detector';

describe('DateTimeColumnDetector', () => {

    const detector = new DateTimeColumnDetector();

    // TODO: verify if columnPair.target.format should not also include the time-zone?
    it('#generate should return empty array when entries are missing', () => {

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

});