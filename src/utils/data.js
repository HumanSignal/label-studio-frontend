import { isString, escapeHtml } from "./utilities";

/**
 * Parse CSV
 * Accepts only numbers as a data
 * Returns hash with names (or "column#n" for headless csv) as a keys
 * and arrays of numbers as a values
 * @param {string} text
 * @returns {{ [string]: number[] }}
 */
export const parseCSV = text => {
  // @todo iterate over newlines for better performance
  const lines = text.split("\n");
  let names;
  let separator = ",";

  // detect separator (2nd line is definitely with data)
  if (lines.length > 1) {
    const candidates = lines[1].trim().match(/[^\d\-.]/g);
    if (!candidates.length) throw new Error("No separators found");
    if (candidates.some(c => c !== candidates[0])) {
      const list = escapeHtml([...new Set(candidates)].join(""));
      throw new Error(`More than one separator found: ${list}`);
    }
    separator = candidates[0];
    if (lines[0].split(separator).length !== lines[1].split(separator).length)
      throw new Error("Different amount of elements in rows");
  }

  // detect header; if it is omitted, use "column#n" as a header names
  names = lines[0].trim().split(separator);
  if (names.some(isNaN)) {
    lines.shift();
    names = names.map(n => n.toLowerCase());
  } else {
    names = names.map((_, i) => "column#" + i);
  }

  const result = {};
  for (let name of names) result[name] = [];

  let row;
  let i;
  for (let line of lines) {
    // skip empty lines including the last line
    if (!line.trim()) continue;
    row = line.split(separator);
    for (i = 0; i < row.length; i++) result[names[i]].push(+row[i]);
  }

  return result;
};

/**
 * Internal helper to check if string is JSON
 * @param {string} value
 * @returns {object|false}
 */
export const tryToParseJSON = value => {
  if (isString(value) && value[0] === "{") {
    try {
      return JSON.parse(value);
    } catch (e) {}
  }

  return false;
};
