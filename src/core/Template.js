/**
 * Convert JavaScript string in dot notation into an object reference
 * @param {Object} obj
 * @param {*} is
 * @param {*} value
 */
function _index(obj, is, value) {
  if (typeof is === 'string') return _index(obj, is.split('.'), value);
  else if (is.length === 1 && value !== undefined) return (obj[is[0]] = value);
  else if (is.length === 0) return obj;
  else return _index(obj[is[0]], is.slice(1), value);
}

/**
 * @todo get rid of this also
 * @param {*} variable
 * @param {*} obj
 */
function variableNotation(variable, obj) {
  if (variable.charAt(0) === '$') {
    const n = variable.substring(1);

    return _index(obj, n);
  } else {
    return variable;
  }
}

export { variableNotation, _index };
