# pg-bind - bind PostgreSQL queries from objects

This extremely small, zero-dependency tool helps you create PostgreSQL queries easier by using objects and automated objects to values bindings. Forget the dollar sign `$1` - use pg-bind.

**Jump to**:

- [API](#api)
- [Docs](#docs)
- [Tests](#tests)

## Quick start

Install dependency:
```bash
npm install --save pg-bind
```

Require library in your code:
```JavaScript
const bind  = require('pg-bind');
const query = bind('SELECT * FROM table WHERE age = :age', {age: 1});
```

## Features:

### Bind queries

With `pg-bind` you can do that:

```JavaScript
const bind  = require('pg-bind');
const obj   = {a: 1, b: 2, c: 3};
const query = bind('SELECT :a, :b, :c', obj); // Result is gonna be the same

// Query: {text: 'SELECT $1, $2, $3', values: [1, 2, 3]}
```

And if query gets even more complicated (and it usually is):

```JavaScript
// How would you count binding here? Aha!
const bind  = require('pg-bind');
const query = `
    WITH prepared_statement AS (
        SELECT :blah, col1
        FROM some_table
        WHERE col2 = :kek
    )
    SELECT :colOne
    FROM prepared_statement
`;

const prepared = bind(query, {
    blah: 'blah',
    kek: 'lol',
    colOne: 'one'
});
```

As you can see binding of queries is easy and queries themselves are more readable than with $ (dollar sign) bindings.

### Bind multiple insert queries

If you ever wanted to insert multiple rows with one INSERT statement and concatenated strings (or joined an array of strings) for that - I'm deeply sorry.

With `pg-bind` you can do `bind.insert(query, arrayOfObjects)`:

```JavaScript

// We've got an insert list somewhere
const employees = [
    {name: 'lol', age: 228,  role: 'loler'},
    {name: 'kek', age: 1488, role: 'keker'}
];

const insertQuery = bind.insert(`
    INSERT INTO some_table (group_id, name, age, role, whatever)
    VALUES (1, :name, :age, :role, 'whatever')
`, employees);

// insertQuery will be:
// {
//  text: `
//      INSERT INTO some_table (group_id, name, age, role, whatever)
//      VALUES (1, $1, $2, $3, 'whatever'),
//        (1, $4, $5, $6, 'whatever')`,
//  values: ['lol', 228, 'loler', 'kek', 1488, 'keker']
// }
```

Is it hard? Nope. Is it hard to do it on your own? Probably.

---

<a name="api"></a>

## API

**bind(query: String, values: Object)** -> *{text: String, values: Array}*

Create query object supported by [node-postgres](https://github.com/brianc/node-postgres) with text and values properties.

- All the binding parameters must be prefixed with ':' sign (i.e. `:param`).
- Bound params
- If param is not found/present in object - `null` is put instead.
- If object is not passed (or is [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)) into `bind()`, an Error is thrown.

**Examples**:

```JavaScript
const bind = require('pg-bind');

bind(`SELECT * FROM table WHERE col = :colVal`, {colVal: 'sammy'}]);
// Result: {
// text: `SELECT * FROM table WHERE col = $1`
// values: ['sammy']
// }

bind('UPDATE TABLE somethings SET thing = :thing WHERE some = :some', {some: 'kek', thing: 'lol'});
// Result: {
// text: 'UPDATE TABLE somethings SET thing = $1 WHERE some = $2',
// values: ['lol', 'kek']
// }
```


**bind.insert(query: String, values: Object[])** -> *{text: String, values: Array}*

*Alias: bind.bindInsert*

Create multiple/single insert query from pattern.

- Query MUST have `VALUES (...)` block, as it is used to create statements.
- All binding parameters MUST be prefixed with ':' sign. However, as you can see in example above you can put any value into VALUES statement and it will be saved in each insert block
- If `values` is not an Array but an Object -> `bind()` is used. So it's pretty safe on single inserts.


**Examples**:

```JavaScript
const bind = require('pg-bind');

bind.insert(`INSERT INTO user_roles (user_id, role) VALUES (:userId, 'default')`, [{userId: 1}, {userId: 2}]);
// Result: {
// text: `INSERT INTO user_roles (user_id, role) VALUES ($1, 'default'), ($2, 'default')`
// values: [1, 2]
// }
```

---

<a name="docs"></a>

## Documentation

To generate documentation (and open it) run:

```bash
npm run docs                          # just generate docs
npm run docs && open docs/index.html  # generate and open docs in default application for HTML ext
```

<a name="tests"></a>

## Coverage

To generate coverage report (and open it) run:

```bash
npm run coverage                              # generate report
npm run coverare && open coverage/index.html  # generate and open in default application for HTML ext
```

## Tests

To run tests type:

```bash
npm test
```
