import { types, getParent, getEnv, onPatch } from "mobx-state-tree";

import Hotkey from "../core/Hotkey";
import { AllRegionsType } from "../regions";

export default types
  .model("RegionStore", {
    regions: types.array(types.safeReference(AllRegionsType)),
  })
  .actions(self => ({
    addRegion(region) {
      self.regions.push(region);
      getEnv(self).onEntityCreate(region);
    },

    findRegion(pid) {
      return self.regions.find(r => r.pid === pid);
    },

    afterCreate() {
      onPatch(self, patch => {
        if ((patch.op === "add" || patch.op === "delete") && patch.path.indexOf("/regions/") !== -1) {
          self.initHotkeys();
        }
      });
    },

    // init Alt hotkeys for regions selection
    initHotkeys() {
      const PREFIX = "alt+shift+";
      const keys = Hotkey.getKeys();
      const rkeys = keys.filter(k => k.indexOf(PREFIX) !== -1);

      rkeys.forEach(k => Hotkey.removeKey(k));

      let n = 1;
      self.regions.forEach(r => {
        Hotkey.addKey(PREFIX + n, function() {
          self.unselectAll();
          r.selectRegion();
        });
        n = n + 1;
      });

      Hotkey.addKey("alt+shift+$n", () => {}, "Select a region");
    },

    /**
     * Delete region
     * @param {obj} region
     */
    deleteRegion(region) {
      const arr = self.regions;

      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === region) {
          arr.splice(i, 1);
        }
      }

      getEnv(self).onEntityDelete(region);
    },

    unselectAll() {
      self.regions.forEach(r => r.unselectRegion());
      getParent(self).setHighlightedNode(null);
    },

    unhighlightAll() {
      self.regions.forEach(r => r.setHighlight(false));
    },
  }));
