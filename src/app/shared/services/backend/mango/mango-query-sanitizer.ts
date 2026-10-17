import { StringUtils } from 'app/shared/utils';


const CHARS_TO_ESCAPE = '.';

interface MangoFindQuery { fields?: string[]; selector?: Record<string, unknown>; sort?: object[]; }

export function sanitizeIndexQuery<T extends { index: { fields: string[] } }>(query: T): T {
    query.index.fields = query.index.fields.map((f: string) => escape(f));
    return query;
}

export function sanitizeFindQuery(query: object): object {
    sanitizeFields(query);
    sanitizeSelector(query);
    sanitizeSort(query);
    return query;
}

function sanitizeFields(query: MangoFindQuery): void {
    if (query.fields) {
        query.fields = query.fields.map((f: string) => escape(f));
    }
}

function sanitizeSelector(query: MangoFindQuery): void {
    if (query.selector) {
        Object.keys(query.selector).forEach(k => {
            if (k.startsWith('$')) {
                query.selector[k] = sanitizeFieldObjects(query.selector[k] as object[]);
            } else {
                const newKey = escape(k);
                if (k !== newKey) {
                    query.selector[newKey] = query.selector[k];
                    delete query.selector[k];
                }
            }
        });
    }
}

function sanitizeSort(query: MangoFindQuery): void {
    if (query.sort) {
        query.sort = sanitizeFieldObjects(query.sort);
    }
}

function sanitizeFieldObjects(arr: object[]): object[] {
    return arr.map((o: object) => {
        const key = Object.keys(o)[0];
        return {
            [escape(key)]: o[key]
        };
    });
}

function escape(fieldName: string): string {
    return StringUtils.escape(fieldName, CHARS_TO_ESCAPE);
}