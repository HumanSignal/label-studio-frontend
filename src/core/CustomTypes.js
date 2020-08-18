const { types } = require("mobx-state-tree");

/**
 * Validates the value against the given range.
 * By default range is from 0 to 1 including ends.
 * @param {Number} min Minimal value
 * @param {Number} max Maximal value
 */
const Range = (min = 0, max = 1) =>
  types.custom({
    name: "Fractional",
    fromSnapshot(snapshot) {
      return parseFloat(snapshot);
    },
    toSnapshot(value) {
      return value.toString();
    },
    isTargetType(value) {
      const floatValue = parseFloat(value);
      return min <= floatValue && floatValue <= max;
    },
    getValidationMessage(value) {
      if (this.isTargetType(value)) return "";
      return `Value ${value} is outside of fractional range.`;
    },
  });

const HexColor = types.custom({
  name: "CSSColor",
  fromSnapshot(value) {
    return String(value);
  },
  toSnapshot(value) {
    return value.toString();
  },
  isTargetType(value) {
    const colorTester = new Option().style;
    colorTester.color = value;
    return colorTester.color !== "";
  },
  getValidationMessage(value) {
    if (this.isTargetType(value)) return "";
    return `Value ${value} doesn't appear to be a valid HEX color.`;
  },
});

export const customTypes = {
  range: Range,
  color: HexColor,
};
