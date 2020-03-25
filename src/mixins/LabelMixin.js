import { types } from "mobx-state-tree";

import InfoModal from "../components/Infomodal/Infomodal";

/**
 * Wrapper of Control item
 */
const LabelMixin = types.model("LabelMixin").actions(self => ({
  /**
   * Usage check of selected controls before send completion to server
   */
  beforeSend() {
    const names = self.getSelectedNames();

    if (names && self.type === self._type) {
      self.unselectAll();
    }
  },

  // copy state from another Labels object
  copyState(labels) {
    // self.unselectAll();
    labels.getSelectedNames().forEach(l => {
      self.findLabel(l).setSelected(true);
    });
  },

  fromStateJSON(obj, fromModel) {
    self.unselectAll();

    const objectType = obj.value[self._type];

    if (!objectType) {
      InfoModal.error(`Error with ${self._type}.`);
      return;
    }

    if (obj.id) self.pid = obj.id;

    objectType.forEach(obj => {
      const findedObj = self.findLabel(obj);

      if (!findedObj) {
        InfoModal.error(`Error with ${self._type}. Not found: ` + objectType);
        return;
      }

      findedObj.setSelected(true);
    });
  },
}));

export default LabelMixin;
