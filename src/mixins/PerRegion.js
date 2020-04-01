import { types } from "mobx-state-tree";

/*
 * Per Region Mixin
 */
const PerRegionMixin = types
  .model()
  .views(self => ({
    perRegionVisible() {
      if (!self.perregion) return true;

      const region = self.completion.highlightedNode;

      // no region is selected return hidden or
      if (!region) return false;

      // check if selected region is the one this tag is connected to
      if (region.parent.name !== self.toname) return false;

      // we may need to check for specific value
      if (self.whenlabelvalue !== null && self.whenlabelvalue !== undefined)
        return region.hasLabelState(self.whenlabelvalue);

      return true;
    },
  }))
  .actions(self => ({}));

export default PerRegionMixin;
