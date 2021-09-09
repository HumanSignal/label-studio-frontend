import { getEnv, getParent, onPatch, types } from "mobx-state-tree";

import { Hotkey } from "../core/Hotkey";
import { isDefined } from "../utils/utilities";
import { AllRegionsType } from "../regions";
import { debounce } from "../utils/debounce";
import Tree, { TRAVERSE_STOP } from "../core/Tree";

const hotkeys = Hotkey("RegionStore");

const SelectionMap = types.model(
  {
    selected: types.optional(types.map(types.safeReference(AllRegionsType)), {}),
  }).views(self => {
  return {
    get annotation() {
      return getParent(self).annotation;
    },
    get highlighted() {
      return self.selected.size === 1 ? self.selected.values().next().value : null;
    },
    get size() {
      return self.selected.size;
    },
    isSelected(region) {
      return self.selected.has(region.id);
    },
  };
}).actions(self => {
  const updateResultsFromSelection = debounce(() => {
    self._updateResultsFromSelection();
  }, 0);

  return {
    beforeUnselect(region) {
      region.perRegionTags.forEach(tag => tag.submitChanges?.());
    },
    afterUnselect(region) {
      region.afterUnselectRegion?.();
    },
    select(region) {
      self.selected.put(region);
      region.selectRegion && region.selectRegion();

      if (self.highlighted) {
        // @todo some backward compatibility, should be rewritten to state handling
        // @todo but there are some actions should be performed like scroll to region
        self.highlighted.perRegionTags.forEach(tag => tag.updateFromResult?.(undefined));
        updateResultsFromSelection();
      } else {
        updateResultsFromSelection();
      }
    },
    _updateResultsFromSelection() {
      const valuesFromControls = {};
      const controlsByName = {};

      Array.from(self.selected.values()).map((region) => {
        region.results.forEach(result => {
          const controlName = result.from_name.name;
          const currentValue = valuesFromControls[controlName];

          if (currentValue !== undefined) {
            valuesFromControls[controlName] = result.mergeMainValue(currentValue);
          } else {
            controlsByName[controlName] = result.from_name;
            valuesFromControls[controlName] = result.mainValue;
          }
        });
      });
      self.annotation.unselectStates();
      for (let [controlName, value] of Object.entries(valuesFromControls)) {
        const control = controlsByName[controlName];

        control.updateFromResult?.(value);
      }
    },
    unselect(region) {
      self.beforeUnselect(region);
      self.selected.delete(region.id);
      self.afterUnselect(region);
    },
    clear() {
      let regionEntries = self.selected.toJS();

      for (let [, region] of regionEntries) {
        self.beforeUnselect(region);
      }
      self.selected.clear();
      for (let [, region] of regionEntries) {
        self.afterUnselect(region);
      }
    },
    highlight(region) {
      self.clear();
      self.select(region);
    },
  };
});

export default types.model("RegionStore", {
  sort: types.optional(types.enumeration(["date", "score"]), "date"),
  sortOrder: types.optional(types.enumeration(["asc", "desc"]), "desc"),

  group: types.optional(types.enumeration(["type", "label"]), "type"),

  view: types.optional(types.enumeration(["regions", "labels"]), "regions"),
  selection: types.optional(SelectionMap, {}),
}).views(self => {
  let lastClickedItem;
  const getShiftClickSelectedRange = (item, tree) => {
    let regions = [];
    let clickedRegionsFound = 0;

    Tree.traverseTree({ children:tree }, (node) => {
      if (!node.isArea) return;
      if (node.item === lastClickedItem || node.item === item || clickedRegionsFound === 1) {
        if (node.item) regions.push(node.item);
        if (node.item === lastClickedItem) ++clickedRegionsFound;
        if (node.item === item) ++clickedRegionsFound;
      }
      if (clickedRegionsFound >= 2) {
        return TRAVERSE_STOP;
      }
    });

    return regions;
  };
  const createClickRegionInTreeHandler = (tree) => {
    return (ev, item) => {
      if (ev.shiftKey) {
        const regions = getShiftClickSelectedRange(item, tree);

        regions.forEach(region => {
          self.selection.select(region);
        });

        lastClickedItem = null;
        return;
      }
      lastClickedItem = item;
      if (ev.metaKey || ev.ctrlKey) {
        self.toggleSelection(item);
        return;
      }
      if (self.selection.highlighted === item) {
        self.clearSelection();
        return;
      }
      self.highlight(item);
    };
  };

  return{
    get annotation() {
      return getParent(self);
    },

    get classifications() {
      const textAreas = Array.from(self.annotation.names.values())
        .filter(t => isDefined(t))
        .filter(t => t.type === "textarea" && !t.perregion)
        .map(t => t.regions);

      return [].concat(...textAreas);
    },

    get regions() {
      return Array.from(self.annotation.areas.values()).filter(area => !area.classification);
    },

    get suggestions() {
      return Array.from(self.annotation.suggestions.values()).filter(area => !area.classification);
    },

    get isAllHidden() {
      return !self.regions.find(area => !area.hidden);
    },

    get sortedRegions() {
      const sorts = {
        date: isDesc => (isDesc ? self.regions : [...self.regions].reverse()),
        score: isDesc => [...self.regions].sort(isDesc ? (a, b) => b.score - a.score : (a, b) => a.score - b.score),
      };

      const sorted = sorts[self.sort](self.sortOrder === "desc");

      return sorted;
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

      const onClick = createClickRegionInTreeHandler(tree);

      arr.forEach((el, idx) => {
        lookup[el.id] = enrich(el, idx, onClick);
        lookup[el.id]["item"] = el;
        lookup[el.id]["children"] = [];
        lookup[el.id].isArea = true;
      });

      Object.keys(lookup).forEach(key => {
        const el = lookup[key];
        let pid = el["item"].parentID;

        if (pid) {
          let parent = lookup[pid];

          if (!parent) parent = lookup[`${pid}#${self.annotation.id}`];
          if (parent) {
            parent.children.push(el);
            return;
          }
        }
        tree.push(el);
      });

      return tree;
    },

    asLabelsTree(enrich) {
      // collect all label states into two maps
      let labels = {};
      const map = {};

      self.regions.forEach(r => {
        const selectedLabels = r.labeling?.selectedLabels || r.emptyLabel && [r.emptyLabel];

        if (selectedLabels) {
          selectedLabels.forEach(s => {
            const key = `${s.value}#${s.id}`;

            labels[key] = s;
            if (key in map) map[key].push(r);
            else map[key] = [r];
          });
        } else {
          const key = `_empty`;

          labels = { [key]: { id: key, isNotLabel: true }, ...labels };
          if (key in map) map[key].push(r);
          else map[key] = [r];
        }
      });

      // create the tree
      let idx = 0;
      const tree = [];
      const onClick = createClickRegionInTreeHandler(tree);

      Object.keys(labels).forEach(key => {
        const el = enrich(labels[key], idx, true, map[key]);

        el["children"] = map[key].map(r => {
          let child = enrich(r, idx++, false, null, onClick);

          child.item = r;
          child.isArea = true;
          return child;
        });

        tree.push(el);
      });

      return tree;
    },

    get hasSelection() {
      return !!self.selection.size;
    },
    isSelected(region) {
      return self.selection.isSelected(region);
    },
  };
}).actions(self => ({
  addRegion(region) {
    self.regions.push(region);
    getEnv(self).events.invoke("entityCreate", region);
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
    const children = self.filterByParentID(region.id);

    children && children.forEach(r => r.setParentID(region.parentID));

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === region) {
        arr.splice(i, 1);
      }
    }

    getEnv(self).events.invoke("entityDelete", region);
    self.initHotkeys();
  },

  findRegionID(id) {
    return self.regions.find(r => r.id === id);
  },

  findRegion(id) {
    return self.regions.find(r => r.id === id);
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
    self.view = self.annotation.store.settings.displayLabelsByDefault ? "labels" : "regions";
  },

  // init Alt hotkeys for regions selection
  initHotkeys() {
    const PREFIX = "alt+shift+";

    hotkeys.unbindAll();

    self.sortedRegions.forEach((r, n) => {
      hotkeys.addKey(PREFIX + (n + 1), function() {
        self.unselectAll();
        r.selectRegion();
      });
    });

    // this is added just for the reference to show up in the
    // settings page
    hotkeys.addKey("alt+shift+$n", () => {}, "Select a region");
  },

  /**
   * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
   */
  unselectAll() {
    self.annotation.unselectAll();
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

  toggleVisibility() {
    const shouldBeHidden = !self.isAllHidden;

    self.regions.forEach(area => {
      if (area.hidden !== shouldBeHidden) {
        area.toggleHidden();
      }
    });
  },

  setHiddenByLabel(shouldBeHidden, label) {
    self.regions.forEach(area => {
      if (area.hidden !== shouldBeHidden) {
        const l = area.labeling;

        if (l) {
          const selected = l.selectedLabels;

          if (selected.includes(label)) {
            area.toggleHidden();
          }
        }
      }
    });
  },
  highlight(area) {
    self.selection.highlight(area);
  },

  clearSelection() {
    self.selection.clear();
  },

  toggleSelection(region, isSelected) {
    if (!isDefined(isSelected)) isSelected = !self.selection.isSelected(region);
    if (isSelected) {
      self.selection.select(region);
    } else {
      self.selection.unselect(region);
    }
  },

}));
