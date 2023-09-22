import { sanitizeFindQuery, sanitizeIndexQuery } from './mango-query-sanitizer';

describe('mango-query-sanitizer', () => {

    it('#sanitizeIndexQuery', () => {
        // given
        const query = {
            index: {
                fields: ['Proz.']
            },
            ddoc: 'index_Proz.'
        };

        // when
        const result = sanitizeIndexQuery(query);

        // then
        expect(result).toEqual({
            index: {
                fields: ['Proz\\.']
            },
            ddoc: 'index_Proz.'
        });
    });

    it('#sanitizeFindQuery sorted', () => {
        // given
        const query = {
            selector: {
                'Proz.': {
                    $gt: null
                }
            },
            fields: ['Proz.'],
            sort: [
                {
                    'Proz.': 'asc'
                }
            ],
            limit: 1
        };

        // when
        const result = sanitizeFindQuery(query);

        // then
        expect(result).toEqual({
            selector: {
                'Proz\\.': {
                    $gt: null
                }
            },
            fields: ['Proz\\.'],
            sort: [
                {
                    'Proz\\.': 'asc'
                }
            ],
            limit: 1
        });

    });

    it('#sanitizeFindQuery two filters', () => {
        // given
        const query = {
            selector: {
                $and: [
                    {
                        Name: {
                            $regex: '(?i).*A.*'
                        }
                    },
                    {
                        'Proz.': {
                            $eq: 90
                        }
                    }
                ]
            },
            fields: ['_id'],
            limit: 1000000
        };

        // when
        const result = sanitizeFindQuery(query);

        // then
        expect(result).toEqual({
            selector: {
                $and: [
                    {
                        Name: {
                            $regex: '(?i).*A.*'
                        }
                    },
                    {
                        'Proz\\.': {
                            $eq: 90
                        }
                    }
                ]
            },
            fields: ['_id'],
            limit: 1000000
        });

    });

});