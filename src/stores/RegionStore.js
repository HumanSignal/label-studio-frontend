import { types, getParent, getEnv, onPatch } from "mobx-state-tree";

import Hotkey from "../core/Hotkey";
import { AllRegionsType } from "../regions";

export default types
  .model("RegionStore", {
    regions: types.array(types.safeReference(AllRegionsType)),

    sort: types.optional(types.enumeration(["date", "score"]), "date"),
    sortOrder: types.optional(types.enumeration(["asc", "desc"]), "desc"),

    group: types.optional(types.enumeration(["type", "label"]), "type"),
  })
  .views(self => ({
    get sortedRegions() {
      const sorts = {
        date: () => self.regions,
        score: () => self.regions.sort((a, b) => a.score - b.score),
      };

      return sorts[self.sort]();
      // TODO
      // return (self.sortOrder === 'asc') ? r.slice().reverse() : r;
    },
  }))
  .actions(self => ({
    addRegion(region) {
      self.regions.push(region);
      getEnv(self).onEntityCreate(region);
    },

    toggleSortOrder() {
      if (self.sortOrder === "asc") self.sortOrder = "desc";
      else self.sortOrder = "asc";
    },

    setSort(sort) {
      self.sortOrder = "desc";
      self.sort = sort;
      self.initHotkeys();
    },

    setGroup(group) {
      self.group = group;
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
      self.initHotkeys();
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

      self.sortedRegions.forEach((r, n) => {
        Hotkey.addKey(PREFIX + (n + 1), function() {
          self.unselectAll();
          r.selectRegion();
        });
      });

      // this is added just for the reference to show up in the
      // settings page
      Hotkey.addKey("alt+shift+$n", () => {}, "Select a region");
    },

    unselectAll() {
      self.regions.forEach(r => r.unselectRegion());
      getParent(self).setHighlightedNode(null);
    },

    unhighlightAll() {
      self.regions.forEach(r => r.setHighlight(false));
    },

    selectNext() {
      const { regions } = self;
      const idx = self.regions.findIndex(r => r.selected);
      idx !== -1 && regions[idx].unselectRegion();

      const next = regions[idx + 1] !== "undefined" ? regions[idx + 1] : regions[0];
      next && next.selectRegion();
    },
  }));
