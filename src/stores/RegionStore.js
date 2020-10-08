import { types, getParent, getEnv, onPatch } from "mobx-state-tree";

import Hotkey from "../core/Hotkey";

export default types
  .model("RegionStore", {
    sort: types.optional(types.enumeration(["date", "score"]), "date"),
    sortOrder: types.optional(types.enumeration(["asc", "desc"]), "desc"),

    group: types.optional(types.enumeration(["type", "label"]), "type"),

    view: types.optional(types.enumeration(["regions", "labels"]), "regions"),
  })
  .views(self => ({
    get completion() {
      return getParent(self);
    },

    get regions() {
      return Array.from(self.completion.areas.values()).filter(area => !area.classification);
    },

    get sortedRegions() {
      const sorts = {
        date: () => self.regions,
        score: () => self.regions.sort((a, b) => b.score - a.score),
      };

      const r = sorts[self.sort]();
      return self.sortOrder === "asc" ? r.slice().reverse() : r;
    },

    asTree(enrich) {
      // every region has a parentID
      // parentID is an empty string - "" if it's top level
      // or it can contain a string key to the parent region
      // [ { id: "1", parentID: "" }, { id: "2", parentID: "1" } ]
      // would create a tree of two elements

      const arr = self.sortedRegions;
      const tree = [],
        lookup = {};

      arr.forEach((el, idx) => {
        lookup[el.pid] = enrich(el, idx);
        lookup[el.pid]["item"] = el;
        lookup[el.pid]["children"] = [];
      });

      Object.keys(lookup).forEach(key => {
        const el = lookup[key];
        if (el["item"].parentID) {
          lookup[el["item"].parentID]["children"].push(el);
        } else {
          tree.push(el);
        }
      });

      return tree;
    },

    asLabelsTree(enrich) {
      // collect all label states into two maps
      const labels = {};
      const map = {};
      self.regions.forEach(r => {
        const l = r.labeling;
        if (l) {
          const selected = l.selectedLabels;
          selected &&
            selected.forEach(s => {
              labels[s._value] = s;
              if (s._value in map) map[s._value].push(r);
              else map[s._value] = [r];
            });
        }
      });

      // create the tree
      let idx = 0;
      const tree = Object.keys(labels).map(lname => {
        const el = enrich(labels[lname], idx, true);
        el["children"] = map[lname].map(r => enrich(r, idx++));

        return el;
      });

      return tree;
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

    setView(view) {
      self.view = view;
    },

    setSort(sort) {
      if (self.sort === sort) {
        self.toggleSortOrder();
      } else {
        self.sortOrder = "desc";
        self.sort = sort;
      }
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

      // find regions that have that region as a parent
      const children = self.filterByParentID(region.pid);
      children && children.forEach(r => r.setParentID(region.parentID));

      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === region) {
          arr.splice(i, 1);
        }
      }

      getEnv(self).onEntityDelete(region);
      self.initHotkeys();
    },

    findRegionID(id) {
      return self.regions.find(r => r.id === id);
    },

    findRegion(pid) {
      return self.regions.find(r => r.pid === pid);
    },

    filterByParentID(id) {
      return self.regions.filter(r => r.parentID === id);
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

    /**
     * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
     */
    unselectAll(tryToKeepStates = false) {
      self.completion.unselectAll();
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
