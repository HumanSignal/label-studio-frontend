import { types, getRoot } from "mobx-state-tree";

import InfoModal from "../../components/Infomodal/Infomodal";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import ControlBase from "./Base";

/**
 * Pairwise element. Compare two different objects, works with any label studio object
 * @example
 * <View>
 *   <Pairwise name="pairwise" leftClass="text1" rightClass="text2" toName="txt-1,txt-2"></Pairwise>
 *   <Text name="txt-1" value="Text 1" />
 *   <Text name="txt-2" value="Text 2" />
 * </View>
 * @example
 * <!-- You can also style the appearence using the View tag: -->
 * <View>
 *   <Pairwise name="pw" toName="txt-1,txt-2"></Pairwise>
 *   <View style="display: flex;">
 *     <View style="margin-right: 1em;"><Text name="txt-1" value="$text1" /></View>
 *     <View><Text name="txt-2" value="$text2" /></View>
 *   </View>
 * </View>
 * @name Pairwise
 * @param {string} name               - Name of the element
 * @param {string} toName             - Names of the elements you want to compare, comma-separated
 * @param {string} [selectionStyle]   - Style of the selection
 * @params {string} [leftClass=left]  - Class name of the left object
 * @params {string} [rightClass=left] - Class name of the right object
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  selectionstyle: types.maybeNull(types.string),
  leftclass: types.maybeNull(types.string),
  rightclass: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "pairwise",
    selected: types.maybeNull(types.enumeration(["left", "right", "none"])),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get names() {
      return self.toname.split(",");
    },

    get left() {
      return self.completion.names.get(self.names[0]);
    },

    get right() {
      return self.completion.names.get(self.names[1]);
    },

    get valueType() {
      return "selected";
    },

    get result() {
      return self.completion.results.find(r => r.from_name === self);
    },
  }))
  .actions(self => ({
    updateResult() {
      const { result, selected } = self;
      if (selected === "none") {
        if (result) result.area.removeResult(result);
      } else {
        if (result) result.setValue(selected);
        else {
          self.completion.createResult({}, { selected }, self, self.name);
        }
      }
    },

    setResult(dir = "none") {
      self.selected = dir;
      self.left.addProp("style", dir === "left" ? self._selection : {});
      self.right.addProp("style", dir === "right" ? self._selection : {});
    },

    selectLeft() {
      self.setResult(self.selected === "left" ? "none" : "left");
      self.updateResult();
    },

    selectRight() {
      self.setResult(self.selected === "right" ? "none" : "right");
      self.updateResult();
    },

    afterCreate() {
      if (self.names.length !== 2 || self.names[0] === self.names[1]) {
        InfoModal.error(
          `Incorrect toName parameter on Pairwise, should be two names separated by the comma: name1,name2`,
        );
      }

      let selection = {};
      if (self.selectionstyle) {
        const s = Tree.cssConverter(self.selectionstyle);
        for (let key in s) {
          selection[key] = s[key];
        }
      } else {
        selection = {
          backgroundColor: "#f6ffed",
          border: "1px solid #b7eb8f",
        };
      }

      self._selection = selection;
    },

    needsUpdate() {
      if (self.result) self.setResult(self.result.value.selected);
      else self.setResult();
    },

    completionAttached() {
      // @todo completion attached in a weird way, so do that next tick, with fixed tree
      setTimeout(() => {
        self.left.addProp("onClick", self.selectLeft);
        self.right.addProp("onClick", self.selectRight);
        self.setResult(self.result?.value.selected);
      });
    },
  }));

const PairwiseModel = types.compose("PairwiseModel", TagAttrs, ControlBase, Model);

const HtxPairwise = () => {
  return null;
};

Registry.addTag("pairwise", PairwiseModel, HtxPairwise);
Registry.addObjectType(PairwiseModel);

export { HtxPairwise, PairwiseModel };
