import { types, getParent } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";

export const AreaMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
  })
  .views(self => ({
    get regions() {
      return getParent(self, 2).regions.filter(r => r.area === self);
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
  }));
