import { types } from 'mobx-state-tree';

/**
 * @todo rework this into MetaMixin for all the meta data
 * Meta Information
 * For normalize many labels to one value
 */
const NormalizationMixin = types
  .model({
    meta: types.frozen({}),
    normInput: types.maybeNull(types.string),
  })
  .preProcessSnapshot((sn) => {
    if (!sn.meta) return sn;
    return {
      ...sn,
      normInput: sn.meta?.text?.[0] ?? null,
    };
  })
  .actions(self => ({
    setMetaValue(key, value) {
      self.meta = { ...self.meta, [key]: value };
    },

    /**
     * Set meta text
     * @param {*} val
     * @todo it's text, not any info
     */
    setMetaInfo(val) {
      if (val) {
        self.meta = { ...self.meta, text: [val] };
      } else {
        const adjusted = { ...self.meta };

        delete adjusted.text;
        self.meta = adjusted;
      }
    },

    /**
     * Delete meta text
     */
    deleteMetaInfo() {
      self.setMetaInfo('');
    },

    setNormInput(val) {
      self.normInput = val;
    },
  }));

export default NormalizationMixin;
