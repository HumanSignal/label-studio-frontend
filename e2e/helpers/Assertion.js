const Helpers = require('../tests/helpers');
const assert = require('assert');
const Helper = require('@codeceptjs/helper');

class AssertionHelper extends Helper {
  assertDeepEqualWithTolerance(actual, expected, fractionDigits = 2, message) {
    assert.deepStrictEqual(
      Helpers.convertToFixed(actual, fractionDigits),
      Helpers.convertToFixed(expected, fractionDigits),
      message,
    );
  }
  assertNotDeepEqualWithTolerance(actual, expected, fractionDigits = 2, message) {
    assert.notDeepStrictEqual(
      Helpers.convertToFixed(actual, fractionDigits),
      Helpers.convertToFixed(expected, fractionDigits),
      message,
    );
  }
}

module.exports = AssertionHelper;
