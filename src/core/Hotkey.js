import keymaster from "keymaster";
import { createElement } from "react";
import { Tooltip } from "../common/Tooltip/Tooltip";
import { isDefined, isMacOS } from "../utils/utilities";
import defaultKeymap from "./settings/keymap.json";

// Validate keymap integrity
const allowedKeympaKeys = ['key', 'mac', 'description'];

const validateKeymap = (keymap) => {
  Object.entries(keymap).forEach(([name, settings]) => {
    Object.keys(settings).forEach(key => {
      if (!allowedKeympaKeys.includes(key)) {
        throw new Error(`Unknown keymap property ${key} for key ${name}`);
      }
    });
  });
};

validateKeymap(defaultKeymap);

const DEFAULT_SCOPE = "__main__";
const INPUT_SCOPE = "__input__";

let _hotkeys_desc = {};
let _namespaces = {};
let _destructors = [];

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

  const unbind = () => {
    for (let scope of [DEFAULT_SCOPE, INPUT_SCOPE]) {
      for (let key of Object.keys(_hotkeys_map)) {
        keymaster.unbind(key, scope);
        delete _hotkeys_desc[key];
      }
    }

    _hotkeys_map = {};
  };

  _destructors.push(unbind);

  return {
    /**
     * Add key
     * @param {string} key Key shortcut
     * @param {keymaster.KeyHandler} func Shortcut handler
     * @param {string} desc Shortcut description
     * @param {DEFAULT_SCOPE | INPUT_SCOPE} scope Shortcut scope
     */
    addKey(key, func, desc, scope = DEFAULT_SCOPE) {
      if (!isDefined(key)) return;

      if (_hotkeys_map[key]) {
        console.warn(`Key already added: ${key}. It's possibly a bug.`);
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
     * @param {string} key Key shortcut
     * @param {keymaster.KeyHandler} func Shortcut handler
     * @param {string} desc Shortcut description
     * @param {DEFAULT_SCOPE | INPUT_SCOPE} scope Shortcut scope
     */
    overwriteKey(key, func, desc, scope = DEFAULT_SCOPE) {
      if (!isDefined(key)) return;

      if (this.hasKey(key)) {
        this.removeKey(key, scope);
      }

      this.addKey(key, func, desc, scope);
    },

    /**
     * Removes a shortcut
     * @param {string} key Key shortcut
     * @param {DEFAULT_SCOPE | INPUT_SCOPE} scope Shortcut scope
     */
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

    /**
     * Add hotkey from keymap
     * @param {keyof keymap} name
     * @param {keymaster.KeyHandler} func
     * @param {DEFAULT_SCOPE | INPUT_SCOPE} scope
     */
    addNamed(name, func, scope) {
      const hotkey = defaultKeymap[name];

      if (isDefined(hotkey)) {
        const shortcut = isMacOS() ? hotkey.mac ?? hotkey.key : hotkey.key;

        this.addKey(shortcut, func, hotkey.description, scope);
      } else {
        throw new Error(`Unknown named hotkey ${hotkey}`);
      }
    },

    /**
     * Removed named hotkey
     * @param {keyof keymap} name
     * @param {DEFAULT_SCOPE | INPUT_SCOPE} scope
     */
    removeNamed(name, scope) {
      const hotkey = defaultKeymap[name];

      if (isDefined(hotkey)) {
        const shortcut = isMacOS() ? hotkey.mac ?? hotkey.key : hotkey.key;

        this.removeKey(shortcut, scope);
      } else {
        throw new Error(`Unknown named hotkey ${hotkey}`);
      }
    },

    /**
     * Add hotkey from keymap
     * @param {keyof keymap} name
     * @param {keymaster.KeyHandler} func
     * @param {DEFAULT_SCOPE | INPUT_SCOPE} scope
     */
    overwriteNamed(name, func, scope) {
      const hotkey = defaultKeymap[name];

      if (isDefined(hotkey)) {
        const shortcut = isMacOS() ? hotkey.mac ?? hotkey.key : hotkey.key;

        this.overwriteKey(shortcut, func, hotkey.description, scope);
      } else {
        throw new Error(`Unknown named hotkey ${hotkey}`);
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
      unbind();
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

Hotkey.keymap = { ...defaultKeymap };

Hotkey.setKeymap = (newKeymap) => {
  validateKeymap(newKeymap);

  Object.assign(Hotkey.keymap, newKeymap);
};

Hotkey.keysDescipritions = function() {
  return _hotkeys_desc;
};

Hotkey.namespaces = () => {
  return _namespaces;
};

Hotkey.unbindAll = () => {
  _destructors.forEach((unbind) => unbind());
};

/**
 * Set scope of hotkeys
 * @param {*} scope
 */
Hotkey.setScope = function(scope) {
  keymaster.setScope(scope);
};

Hotkey.Tooltip = ({ name, children, ...props }) => {
  const hotkey = defaultKeymap[name];

  if (isDefined(hotkey)) {
    const shortcut = isMacOS() ? hotkey.mac ?? hotkey.key : hotkey.key;

    const title = `${hotkey.description} [${shortcut}]`;

    return createElement(Tooltip, {
      ...props,
      title,
    }, children);
  }

  return children;
};

window.HtxHotkeys = Hotkey;

export default {
  DEFAULT_SCOPE,
  INPUT_SCOPE,
  Hotkey,
};
