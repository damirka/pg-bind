/**
 * @module pg-bind
 */

'use strict';

module.exports = exports = bindQuery;
exports.insert = exports.bindInsert = bindInsertQuery;

/**
 * Binds query params from object
 *
 * @example
 * // Result for this command would be:
 * // {
 * //   text: 'INSERT INTO foo (id, name) VALUES ($1, $2)'
 * //   values: [1, 'kek']
 * // }
 * let {text, values} = bindQuery('INSERT INTO foo (id, name) VALUES (:id, :user_name)', {id: 1, user_name: 'kek'});
 *
 * // Somewhere in db-related code...
 * pgClient.query(text, values).then(() => ...);
 *
 * @param  {String} queryString Query pattern with values inserted
 * @param  {Object} replaceObj  Object with replacements
 * @param  {Object} startIndex  Index to start with
 * @return {Object}             Object with final query and it's value bindings
 */
function bindQuery(queryString, replaceObj, startIndex = 1) {

    if (!replaceObj) {
        throw new Error('You MUST pass replaceObj as second argument');
    }

    // Initialize all the variables in here
    let [binds, values, index] = [new Map, [], startIndex];

    // Using String.prototype.replace replace all the params in query pattern
    let text = queryString.replace(/[:]?:([a-zA-Z_]+)/g, (search, param) => {
        // Return values that begin as typecast
        if (search.slice(0, 2) === '::') {
            return search;
        }

        // If we already set this parameter
        if (binds.get(param) !== undefined) {
            return '$' + binds.get(param);
        }

        // In other case push parameter into binds and update values array
        binds.set(param, index);
        values.push(replaceObj[param]);
        return '$' + index++;
    });

    return {text, values};
}


/**
 * Binds INSERT query using array of objects
 *
 * @example
 * // Result for this command would be:
 * // {
 * //   text: 'INSERT INTO foo (id, name, age) VALUES ($1, $2, 123), ($3, $4, 123)',
 * //   values: [1, 'kek', 2, 'lol']
 * // }
 * let {text, values} = bindInsertQuery('INSERT INTO foo (id, name, age) VALUES (:id, :name, 123)', [
 *   {id: 1, name: 'kek'},
 *   {id: 2, name: 'lol'}
 * ]);
 *
 * // Somewhere in db-related code...
 * pgClient.query(text, values).then(() => ...);
 *
 * @param  {String}   queryString          INSERT statement with replacements as in bindQuery
 * @param  {Object[]} [replacementsArr=[]] Array of objects to use when creating expression
 * @return {Object}                        Object with final query and it's value bindings
 */
function bindInsertQuery(queryString, replacementsArr = []) {

    // Whether it's not an array -> do regular bind with single value
    if (!Array.isArray(replacementsArr)) {
        return bindQuery(queryString, replacementsArr);
    }

    // Initialize regular expressions to find VALUES (<pattern>)
    const start = /VALUES[\s]*\(/img;
    const end   = /\)[\s]*(?:RETURNING|ON|$)/ig;

    // Use this regexp to get lastIndex
    const stRes = start.test(queryString);

    if (!stRes) {
        throw new Error('Cannot find VALUES keyword');
    }

    // Attach lastIndex to second regexp
    end.lastIndex = start.lastIndex;

    // Get position of closing brace
    let search = end.exec(queryString);

    // If search returned null - something went wrong
    if (search === null) {
        throw new Error('Cannot find closing brace for VALUES expression');
    }

    search = search && search[0];

    // String that contains pattern for VALUES expression
    // Can be absolutely anything, supported by bindQuery
    // Example: 'string', :value1, DEFAULT, 'string', 123, :value2
    const bindPattern = queryString.slice(start.lastIndex, end.lastIndex - search.length);

    // Then do the bindings as many times as many replacements
    // have been passed into this function.
    // I can't call changeable arrays a constant. Don't ask
    let index    = 1;
    let patterns = [];
    let values   = [];

    // Iterate through replacements to bind each one as regular query
    for (let replacement of replacementsArr) {

        let query = bindQuery(bindPattern, replacement, index);

        patterns.push('(' + query.text + ')');
        values = values.concat(query.values);

        index += query.values.length;
    }

    const text = [
        queryString.slice(0, start.lastIndex - 1),
        patterns.join(', '),
        queryString.slice(end.lastIndex - search.length + 1)
    ].join(' ');

    return {text, values};
}
