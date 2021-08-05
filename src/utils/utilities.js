import { toCamelCase } from "strman";

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

/**
 * Makes string safe to use inside dangerouslySetInnerHTML
 * @param {string} unsafe
 */
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Compares two arrays; order matters
 * @template T
 * @param {T[]} arr1 array 1
 * @param {T[]} arr2 array 2
 */
export function isArraysEqual(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every((value, index) => arr2[index] === value);
}

/**
 * Convert any value to an array
 * @template T
 * @param {T} value
 * @returns {T[]}
 */
export function wrapArray(value) {
  return [].concat(...[value]);
}

export function delay(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const isDefined = value => {
  return value !== null && value !== undefined;
};

export function findClosestParent(el, predicate = () => true, parentGetter = el => el.parent) {
  while ((el = parentGetter(el))) {
    if (predicate(el)) {
      return el;
    }
  }
  return null;
}

export function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

export const chunks = (source, chunkSize) => {
  const result = [];
  let i,j;

  for (i=0,j=source.length; i<j; i+=chunkSize) {
    result.push(source.slice(i,i+chunkSize));
  }

  return result;
};

export const userDisplayName = (user) => {
  const firstName = user.firstName ?? user.firstName;
  const lastName = user.lastName ?? user.lastName;

  return (firstName || lastName)
    ? [firstName, lastName].filter(n => !!n).join(" ").trim()
    : (user.username)
      ? user.username
      : user.email;
};

export const camelizeKeys = (object) => {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => {
    if (Object.prototype.toString.call(value) === '[object Object]') {
      return [toCamelCase(key), camelizeKeys(value)];
    } else {
      return [toCamelCase(key), value];
    }
  }));
};
