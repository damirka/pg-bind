/* global bind, assert */
/**
 * @module test/unit/bind-query
 */

'use strict';

describe('pg-bind~bindQuery', function () {

    it('should throw error when no bindings have been passed', function () {

        const query  = 'SELECT * FROM table';
        const result = (function () {
            try {
                return bind(query);
            } catch(err) { return err; }
        })();

        assert(result instanceof Error, 'Error must be thrown');
    });

    it('should bind object properly and keep the casts', function () {

        const query    = "SELECT ':a'::int, ':b'::text";
        const expected = "SELECT '$1'::int, '$2'::text";
        const obj      = {b: 2, a: 1};
        const result   = bind(query, obj);

        assert(result.values[0] === obj.a, 'First property must match');
        assert(result.values[1] === obj.b, 'Second property must match');
        assert(result.values.length === 2, 'Only two values must be passed');
        assert(result.text === expected,   'Query must match expected one');
    });

    it('should work with multiline strings', function () {

        const query = `
            SELECT b, ':b'::text, :c
            FROM table
            WHERE a = :a`;

        const expected = `
            SELECT b, '$1'::text, $2
            FROM table
            WHERE a = $3`;

        const obj    = {a: 1, b: 2, c: 2};
        const result = bind(query, obj);

        assert(result.values[0] === obj.b, 'First property must match');
        assert(result.values[1] === obj.c, 'Second property must match');
        assert(result.values[2] === obj.a, 'Third property must match');
        assert(result.text === expected,   'Query must match expected one');
        assert(result.values.length === 3, 'Only three values must be passed');
    });

    xit('should skip bindings in single quotes as not supported by pg', function () {});
});
