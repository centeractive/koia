import { StringUtils } from 'app/shared/utils';


const CHARS_TO_ESCAPE = '.';

interface MangoFindQuery { fields?: string[]; selector?: object; sort?: object[]; }

export function sanitizeIndexQuery<T extends { index: { fields: string[] } }>(query: T): T {
    query.index.fields = query.index.fields.map((f: string) => escape(f));
    return query;
}

export function sanitizeFindQuery(query: MangoFindQuery): object {
    if (query.fields) {
        query.fields = query.fields.map((f: string) => escape(f));
    }
    if (query.selector) {
        query.selector = escapeFieldNames(query.selector);
    }
    if (query.sort) {
        query.sort = query.sort.map(o => escapeFieldNames(o));
    }
    return query;
}

/**
 * escapes the field names of the specified object and of the objects nested in combination operators (i.e. '$and', '$or')
 */
function escapeFieldNames(obj: object): object {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) =>
        key.startsWith('$') && Array.isArray(value) ? [key, value.map(o => escapeFieldNames(o))] : [escape(key), value]));
}

function escape(fieldName: string): string {
    return StringUtils.escape(fieldName, CHARS_TO_ESCAPE);
}
