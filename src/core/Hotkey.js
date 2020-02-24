import keymaster from "keymaster";

let _hotkeys_map = {};
let _hotkeys_desc = {};

keymaster.filter = function(event) {
  if (keymaster.getScope() === "__none__") return;

  const tag = (event.target || event.srcElement).tagName;
  const name = (event.target || event.srcElement).name;

  keymaster.setScope(/^(INPUT|TEXTAREA|SELECT)$/.test(tag) ? name : "__main__");

  return true;
};

/**
 * Add key
 * @param {*} key
 * @param {*} func
 */
function addKey(key, func, scope = "__main__", desc) {
  if (_hotkeys_map[key]) return;

  _hotkeys_map[key] = func;
  _hotkeys_desc[key] = desc;

  keymaster(key, scope, func);
}

/**
 * Given a key temp overwrites the function, the overwrite is removed
 * after the returning function is called
 */
function overwriteKey(key, func) {}

function removeKey(key) {
  keymaster.unbind(key);

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
  let st = "1234567890qwertasdfgzxcvbyuiophjklnm";
  let combs = st.split("");

  for (var i = 0; i <= combs.length; i++) {
    let comb;
    if (prefix) comb = prefix + "+" + combs[i];
    else comb = combs[i];

    if (!_hotkeys_map.hasOwnProperty(comb)) return comb;
  }

  return null;
}

export default { removeKey, addKey, unbindAll, makeComb, setScope, getKeys };
