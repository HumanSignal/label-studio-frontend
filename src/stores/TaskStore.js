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
      const keys = Object.keys(raw);
      const data = [];

      for (let key of keys) {
        for (let i = 0; i < raw[key].length; i++) {
          if (!data[i]) {
            data[i] = { [key]: raw[key][i] };
          } else {
            data[i][key] = raw[key][i];
          }
        }
      }
      return data;
    },

    get dataSlices() {
      // @todo it should make it `computed` automatically
      if (self.slices) return self.slices;
      // @todo change that from outside
      const count = 10;
      console.log("GETDATA SLICES", count);
      const data = self.dataHash;
      const slice = Math.floor(data.length / count);
      const slices = [];

      for (let i = 0; i < count - 1; i++) {
        slices[i] = data.slice(slice * i, slice * i + slice + 1);
      }
      slices.push(data.slice(slice * (count - 1)));
      self.slices = slices;
      return slices;
    },
  }));

export default TaskStore;
