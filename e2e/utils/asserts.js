const assert = require("assert");
const Helpers = require("../tests/helpers");

function deepEqualWithTolerance(actual, expected, fractionDigits = 2) {
  assert.deepStrictEqual(Helpers.convertToFixed(actual, fractionDigits), Helpers.convertToFixed(expected, fractionDigits));
}
function notDeepEqualWithTolerance(actual, expected, fractionDigits = 2) {
  assert.notDeepStrictEqual(Helpers.convertToFixed(actual, fractionDigits), Helpers.convertToFixed(expected, fractionDigits));
}

module.exports = {
  deepEqualWithTolerance,
  notDeepEqualWithTolerance,
};
