import { types, getType } from "mobx-state-tree";

import Utils from "../utils";
import { cloneNode } from "../core/Helpers";

export default types
  .model("WithStates")
  .views(self => ({
    getAllStatesNames() {
      return Utils.Checkers.flatten(self.states.map(s => s.getSelectedNames()));
    },

    getActiveStates(types = []) {
      const states = self.states;
      const selected = states.filter(s => s.isSelected);

      return types.length ? selected.filter(s => types.includes(getType(s).name)) : selected;
    },

    // returns one color from all the states
    getOneColor(pick = "first") {
      if (!self.states) return;

      if (pick == "first") {
        const s = self.states.find(s => "getSelectedColor" in s);

        return s ? s.getSelectedColor() : null;
      }

      if ((pick = "combine")) {
        // [TODO] combine colors
      }
    },

    getClonedStates() {
      return self.states.map(s => cloneNode(s));
    },
  }))
  .actions(self => ({}));
