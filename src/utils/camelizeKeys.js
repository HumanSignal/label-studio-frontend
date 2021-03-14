const toCamelCase = str => {
  const arr = str.match(/[a-z]+|\d+/gi);
  return arr.map((m, i) => {
    let low = m.toLowerCase();
    if (i !== 0) {
      low = low.split("").map((s, k) => (k === 0 ? s.toUpperCase() : s)).join``;
    }
    return low;
  }).join``;
};

export const camelizeKeys = object => {
  return object
    ? Object.fromEntries(
        Object.entries(object).map(([key, value]) => {
          if (Object.prototype.toString.call(value) === "[object Object]") {
            return [toCamelCase(key), camelizeKeys(value)];
          } else {
            return [toCamelCase(key), value];
          }
        }),
      )
    : null;
};
