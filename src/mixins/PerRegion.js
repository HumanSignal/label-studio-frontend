import { types } from "mobx-state-tree";

export const PER_REGION_MODES = {
  TAG: "tag",
  REGION_LIST: "region-list",
};

/*
 * Per Region Mixin
 */
const PerRegionMixin = types
  .model({
    perregion: types.optional(types.boolean, false),
    whenlabelvalue: types.maybeNull(types.string),
    displaymode: types.optional(types.enumeration(Object.values(PER_REGION_MODES)), PER_REGION_MODES.TAG),
  }).volatile(() => {
    return {
      focusable: false,
    };
  },
  ).views(self => ({
    perRegionVisible() {
      if (!self.perregion) return true;

      const region = self.annotation.highlightedNode;

      if (!region) {
        // no region is selected return hidden
        return false;
      }
      // check if selected region is the one this tag is connected to
      if (region.parent.name !== self.toname) return false;

      // we may need to check for specific value
      if (self.whenlabelvalue !== null && self.whenlabelvalue !== undefined)
        return region.hasLabel(self.whenlabelvalue);

      return true;
    },
  }))
  .actions(() => ({}));

export default PerRegionMixin;
