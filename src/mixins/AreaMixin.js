import { types, getParent } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";

export const AreaMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
  })
  .views(self => ({
    get completion() {
      return getParent(self, 2);
    },

    get regions() {
      return self.completion.regions.filter(r => r.area === self);
    },

    get tag() {
      const region = self.regions.find(r => r.type.endsWith("labels"));
      return region && region.from_name;
    },

    get object() {
      return self.regions[0].to_name;
    },

    get style() {
      const styled = self.regions.find(r => r.style);
      return styled && styled.style;
    },

    // @todo may be slow, consider to add some code to completion (un)select* methods
    get selected() {
      return self.completion.highlightedNode === self;
    },

    getOneColor() {
      return self.style && self.style.fillcolor;
    },
  }))
  .volatile(self => ({
    // selected: false,
  }))
  .actions(self => ({
    setSelected(value) {
      self.selected = value;
    },
  }));
