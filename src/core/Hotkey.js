import keymaster from "keymaster";

let _hotkeys_map = {};
let _hotkeys_desc = {};

const DEFAULT_SCOPE = "__main__";
const INPUT_SCOPE = "__input__";

keymaster.filter = function(event) {
  if (keymaster.getScope() === "__none__") return;

  const tag = (event.target || event.srcElement).tagName;

  keymaster.setScope(/^(INPUT|TEXTAREA|SELECT)$/.test(tag) ? INPUT_SCOPE : DEFAULT_SCOPE);

  return true;
};

/**
 * Add key
 * @param {*} key
 * @param {*} func
 */
function addKey(key, func, desc, scope = DEFAULT_SCOPE) {
  if (_hotkeys_map[key]) return;

  _hotkeys_map[key] = func;
  _hotkeys_desc[key] = desc;

  scope
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(scope => {
      keymaster(key, scope, func);
    });
}

/**
 * Given a key temp overwrites the function, the overwrite is removed
 * after the returning function is called
 */
function overwriteKey(key, func) {} // eslint-disable-line no-unused-vars

function keysDescipritions() {
  return _hotkeys_desc;
}

function removeKey(key, scope = DEFAULT_SCOPE) {
  scope
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(scope => {
      keymaster.unbind(key, scope);
    });

  delete _hotkeys_map[key];
  delete _hotkeys_desc[key];
}

function getKeys() {
  return Object.keys(_hotkeys_map);
}

/**
 * Unbund all hotkeys
 */
function unbindAll() {
  for (let key of Object.keys(_hotkeys_map)) keymaster.unbind(key);

  _hotkeys_map = {};
}

/**
 * Set scope of hotkeys
 * @param {*} scope
 */
function setScope(scope) {
  keymaster.setScope(scope);
}

/**
 * Create combination
 */
function makeComb() {
  let prefix = null;
  let st = "1234567890qwetasdfgzxcvbyiopjklnm";
  let combs = st.split("");

  for (var i = 0; i <= combs.length; i++) {
    let comb;
    if (prefix) comb = prefix + "+" + combs[i];
    else comb = combs[i];

    if (!_hotkeys_map.hasOwnProperty(comb)) return comb;
  }

  return null;
}

export default {
  DEFAULT_SCOPE,
  INPUT_SCOPE,
  removeKey,
  addKey,
  unbindAll,
  makeComb,
  setScope,
  getKeys,
  keysDescipritions,
};
