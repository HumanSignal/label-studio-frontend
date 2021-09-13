import keymaster from "keymaster";
import { isDefined } from "../utils/utilities";

const DEFAULT_SCOPE = "__main__";
const INPUT_SCOPE = "__input__";

let _hotkeys_desc = {};
let _namespaces = {};

keymaster.filter = function(event) {
  if (keymaster.getScope() === "__none__") return;

  const tag = (event.target || event.srcElement).tagName;

  keymaster.setScope(/^(INPUT|TEXTAREA|SELECT)$/.test(tag) ? INPUT_SCOPE : DEFAULT_SCOPE);

  return true;
};

export const Hotkey = (
  namespace = "global",
  description = "Hotkeys",
) => {
  let _hotkeys_map = {};

  _namespaces[namespace] = _namespaces[namespace] ?? {
    description,
    get keys() {
      return _hotkeys_map;
    },
    get descriptions() {
      const descriptions = Object.keys(this.keys).reduce((res, key) => {
        if (_hotkeys_desc[key]) res.push([key, _hotkeys_desc[key]]);

        return res;
      }, []);

      return Object.fromEntries(descriptions);
    },
  };

  return {
    /**
     * Add key
     * @param {*} key
     * @param {*} func
     */
    addKey(key, func, desc, scope = DEFAULT_SCOPE) {
      if (!isDefined(key)) return;

      if (_hotkeys_map[key]) {
        console.warn(`Key already added: ${key}. It's possibly a bug.`);
        return;
      }

      const keyName = key.toLowerCase();

      _hotkeys_map[keyName] = func;
      _hotkeys_desc[keyName] = desc;

      scope
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(scope => {
          keymaster(keyName, scope, (...args) => {
            func(...args);
          });
        });
    },

    /**
     * Given a key temp overwrites the function, the overwrite is removed
     * after the returning function is called
     */
    overwriteKey(key, func, desc, scope = DEFAULT_SCOPE) {
      if (!isDefined(key)) return;

      if (this.hasKey(key)) {
        this.removeKey(key, scope);
      }

      this.addKey(key, func, desc, scope);
    }, // eslint-disable-line no-unused-vars

    removeKey(key, scope = DEFAULT_SCOPE) {
      if (!isDefined(key)) return;

      const keyName = key.toLowerCase();

      if (this.hasKey(keyName)) {
        scope
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(scope => {
            keymaster.unbind(keyName, scope);
          });

        delete _hotkeys_map[keyName];
        delete _hotkeys_desc[keyName];
      }
    },

    hasKey(key) {
      if (!isDefined(key)) return;

      const keyName = key.toLowerCase();

      return isDefined(_hotkeys_map[keyName]);
    },

    getKeys() {
      return Object.keys(_hotkeys_map);
    },

    getNamespace() {
      return _namespaces[namespace];
    },

    addDescription(key, description) {
      if (!_hotkeys_map[key]) {
        _hotkeys_desc[key] = description;
      }
    },

    removeDescription(key) {
      if (!_hotkeys_map) {
        _hotkeys_desc[key];
      }
    },

    /**
     * Unbund all hotkeys
     */
    unbindAll() {
      for (let scope of [DEFAULT_SCOPE, INPUT_SCOPE]) {
        for (let key of Object.keys(_hotkeys_map)) {
          keymaster.unbind(key, scope);
        }
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

Hotkey.namespaces = () => {
  return _namespaces;
};

/**
 * Set scope of hotkeys
 * @param {*} scope
 */
Hotkey.setScope = function(scope) {
  keymaster.setScope(scope);
};

window.HtxHotkeys = Hotkey;

export default {
  DEFAULT_SCOPE,
  INPUT_SCOPE,
  Hotkey,
};
