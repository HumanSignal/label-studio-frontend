/**
 * Internal helper to check if parameter is a string
 * @param {*} value
 * @returns {boolean}
 */
export const isString = value => {
  return typeof value === "string" || value instanceof String;
};

/**
 * Internal helper to check if string is empty
 * @param {*} value
 * @returns {boolean}
 */
export const isStringEmpty = value => {
  if (!isString(value)) {
    return false;
  }

  return value.length === 0;
};

/**
 * Internal helper to check if string is JSON
 * @param {string} value
 * @returns {boolean}
 */
export const isStringJSON = value => {
  if (isString(value)) {
    try {
      JSON.parse(value);
    } catch (e) {
      return false;
    }

    return true;
  }

  return false;
};

/**
 * Check if text is url
 * @param {*} i
 * @param {*} text
 */
export function getUrl(i, text) {
  const stringToTest = text.slice(i);
  const myRegexp = /^(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g; // eslint-disable-line no-useless-escape
  const match = myRegexp.exec(stringToTest);

  return match && match.length ? match[1] : "";
}

/**
 * Convert MS to Time String
 * Example: 2000 -> 00:00:02
 * @param {number} ms
 * @returns {string}
 */
export function toTimeString(ms) {
  if (typeof ms === "number") {
    return new Date(ms).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];
  }
}

export function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

export function hashCode(str) {
  var hash = 0;
  if (str.length === 0) {
    return hash + "";
  }
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash + "";
}

export function atobUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
}

export function delay(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
