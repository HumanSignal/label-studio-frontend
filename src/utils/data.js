import { isString, escapeHtml } from "./utilities";

/**
 * Parse CSV
 * Accepts only numbers as a data
 * Returns hash with names (or indexed hash for headless csv) as a keys
 * and arrays of numbers as a values
 * @param {string} text
 * @returns {{ [string]: number[] }}
 */
export const parseCSV = (text, separator = "auto") => {
  // @todo iterate over newlines for better performance
  const lines = text.split("\n");
  let names;

  if (separator !== "auto" && !lines[0].includes(separator)) {
    throw new Error([`Cannot find provided separator "${separator}".`, `Row 1: ${lines[0]}`].join(`\n`));
  }

  // detect separator (2nd line is definitely with data)
  if (separator === "auto" && lines.length > 1) {
    const candidates = lines[1].trim().match(/[,;\s\t]/g);
    if (!candidates.length) throw new Error("No separators found");
    if (candidates.some(c => c !== candidates[0])) {
      const list = Array.from(new Set(candidates))
        .map(escapeHtml)
        .map(s => `"${s}"`)
        .join(", ");
      throw new Error(
        [
          `More than one possible separator found: ${list}`,
          `You can provide correct one with <Timeseries sep=",">`,
        ].join(`\n`),
      );
    }
    separator = candidates[0];
    if (lines[0].split(separator).length !== lines[1].split(separator).length)
      throw new Error(
        [
          `Different amount of elements in rows.`,
          `Row 1: ${lines[0]}`,
          `Row 2: ${lines[1]}`,
          `Guessed separator: ${separator}`,
          `You can provide correct one with <Timeseries sep=",">`,
        ].join(`\n`),
      );
  }

  // detect header; if it is omitted, use indices as a header names
  names = lines[0].trim().split(separator);
  const secondLine = lines[1].trim().split(separator);
  // assume that we have at least one column with numbers
  // and name of this column is not number :)
  // so we have different types for values in first and second rows
  if (!names.every((n, i) => isNaN(n) === isNaN(secondLine[i]))) {
    lines.shift();
    names = names.map(n => n.toLowerCase());
  } else {
    names = names.map((_, i) => i);
  }

  const result = {};
  for (let name of names) result[name] = [];

  if (names.length !== lines[0].split(separator).length) {
    throw new Error(
      [
        `Column names count differs from data columns count.`,
        `Columns: ${names.join(", ")};``Data: ${lines[0]};`,
        `Separator: "${separator}".`,
      ].join("\n"),
    );
  }

  let row;
  let i;
  for (let line of lines) {
    // skip empty lines including the last line
    if (!line.trim()) continue;
    row = line.split(separator);
    for (i = 0; i < row.length; i++) {
      const val = +row[i];
      result[names[i]].push(isNaN(val) ? row[i] : val);
    }
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
