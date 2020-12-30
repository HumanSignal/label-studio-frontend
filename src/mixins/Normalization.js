import { types } from "mobx-state-tree";

/**
 * @todo rework this into MetaMixin for all the meta data
 * Normalization
 * For normalize many labels to one value
 */
const NormalizationMixin = types
  .model({
    meta: types.frozen({}),
    normInput: types.maybeNull(types.string),
    normalization: types.maybeNull(types.string),
  })
  .actions(self => ({
    afterCreate() {
      if (self.meta.normalization) self.normalization = self.meta.normalization;
    },

    /**
     * Set normalization
     * @param {*} val
     */
    setNormalization(val) {
      self.normalization = val;
      if (val) {
        self.meta = { ...self.meta, normalization: val };
      } else {
        const adjusted = { ...self.meta };
        delete adjusted.normalization;
        self.meta = adjusted;
      }
    },

    /**
     * Delete normalization
     */
    deleteNormalization() {
      self.setNormalization("");
    },

    setNormInput(val) {
      self.normInput = val;
    },
  }));

export default NormalizationMixin;
