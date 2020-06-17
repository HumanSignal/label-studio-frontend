import { types } from "mobx-state-tree";

import { cloneNode } from "../core/Helpers";

export default types
  .model("WithStates")
  .views(self => ({
    // returns one color from all the states
    getOneColor(pick = "first") {
      if (!self.states) return;

      if (pick === "first") {
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
