import keymaster from "keymaster";

const DEFAULT_SCOPE = "__main__";
const INPUT_SCOPE = "__input__";

let _hotkeys_desc = {};

keymaster.filter = function(event) {
  if (keymaster.getScope() === "__none__") return;

  const tag = (event.target || event.srcElement).tagName;

  keymaster.setScope(/^(INPUT|TEXTAREA|SELECT)$/.test(tag) ? INPUT_SCOPE : DEFAULT_SCOPE);

  return true;
};

export const Hotkey = name => {
  let _hotkeys_map = {};

  return {
    /**
     * Add key
     * @param {*} key
     * @param {*} func
     */
    addKey(key, func, desc, scope = DEFAULT_SCOPE) {
      if (_hotkeys_map[key]) {
        return;
      }

      _hotkeys_map[key] = func;
      _hotkeys_desc[key] = desc;

      scope
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(scope => {
          keymaster(key, scope, (...args) => {
            func(...args);
          });
        });
    },

    /**
     * Given a key temp overwrites the function, the overwrite is removed
     * after the returning function is called
     */
    overwriteKey(key, func) {}, // eslint-disable-line no-unused-vars

    removeKey(key, scope = DEFAULT_SCOPE) {
      scope
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(scope => {
          keymaster.unbind(key, scope);
        });

      delete _hotkeys_map[key];
      delete _hotkeys_desc[key];
    },

    getKeys() {
      return Object.keys(_hotkeys_map);
    },

    /**
     * Unbund all hotkeys
     */
    unbindAll() {
      for (let key of Object.keys(_hotkeys_map)) {
        keymaster.unbind(key);
      }

      _hotkeys_map = {};
    },

    /**
     * Create combination
     */
    makeComb() {
      let prefix = null;
      let st = "1234567890qwetasdfgzxcvbyiopjklnm";
      let combs = st.split("");

      for (var i = 0; i <= combs.length; i++) {
        let comb;
        if (prefix) comb = prefix + "+" + combs[i];
        else comb = combs[i];

        if (!{}.hasOwnProperty.call(_hotkeys_map, comb)) return comb;
      }

      return null;
    },
  };
};

Hotkey.DEFAULT_SCOPE = DEFAULT_SCOPE;

Hotkey.INPUT_SCOPE = INPUT_SCOPE;

Hotkey.keysDescipritions = function() {
  return _hotkeys_desc;
};

/**
 * Set scope of hotkeys
 * @param {*} scope
 */
Hotkey.setScope = function(scope) {
  keymaster.setScope(scope);
};

export default {
  DEFAULT_SCOPE,
  INPUT_SCOPE,
  Hotkey,
};
