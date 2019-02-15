/**
 * Define globals before later test execution
 *
 * @module test/bootstrap
 */

'use strict';

const bind   = require('../index');
const chai   = require('chai');

// Define global properties as getters (i.e. non-writable ones) to make sure no
// test rewrites them or overuses instance
Object.defineProperties(global, {
    expect: {get: () => chai.expect},
    assert: {get: () => chai.assert},
    chai:   {get: () => chai},
    bind:   {get: () => bind}
});
