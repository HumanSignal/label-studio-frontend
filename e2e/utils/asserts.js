const assert = require("assert");
const Helpers = require("../tests/helpers");

function deepEqualWithTolerance (actual, expected) {
  assert.deepStrictEqual(Helpers.convertToFixed(actual), Helpers.convertToFixed(expected));
}
function notDeepEqualWithTolerance (actual, expected) {
  assert.notDeepStrictEqual(Helpers.convertToFixed(actual), Helpers.convertToFixed(expected));
}

module.exports = {
  deepEqualWithTolerance,
  notDeepEqualWithTolerance,
};
