import { types, getParent } from "mobx-state-tree";

import Utilities from "../utils";

/**
 * Model for HTTP Basic Authorization
 */
const AuthStore = types.model({
  enable: types.optional(types.boolean, false),
  username: types.string,
  password: types.string,
  to: types.string,
});

/**
 * Task Store
 */
const TaskStore = types
  .model("Task", {
    id: types.maybeNull(types.number),
    load: types.optional(types.boolean, false),
    auth: types.maybeNull(AuthStore),
    /**
     * Data of task, may contain an object but in App Store will be transformed into string
     * MST doesn't support processing of dynamic objects with unkown keys value
     */
    data: types.maybeNull(types.string),
  })
  .views(self => ({
    get app() {
      return getParent(self);
    },

    /**
     * Return JSON with task data
     * @returns {object}
     */
    get dataObj() {
      if (Utilities.Checkers.isStringJSON(self.data)) {
        return JSON.parse(self.data);
      } else if (typeof self.data === "object") {
        return self.data;
      } else {
        return null;
      }
    },

    get dataHash() {
      const raw = self.dataObj;
      if (!raw) return null;
      const [first, ...keys] = Object.keys(raw);
      // assume that map is the fastest way to create array of hashes
      const data = raw[first].map(val => ({ [first]: val }));
      // there might be a difference in data arrays length; find the longest
      const max = Math.max(...keys.map(key => raw[key].length));
      // fill the gap if needed
      for (let i = data.length; i < max; i++) {
        data.push({ [first]: undefined });
      }
      for (let key of keys) {
        for (let i = 0; i < max; i++) {
          data[i][key] = raw[key][i];
        }
      }
      console.log("DATA HASH", max);
      return data;
    },
  }));

export default TaskStore;
