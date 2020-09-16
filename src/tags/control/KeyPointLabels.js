import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { KeyPointModel } from "./KeyPoint";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * KeyPointLabels tag
 * KeyPointLabels tag creates labeled keypoints
 * @example
 * <View>
 *   <KeyPointLabels name="kp-1" toName="img-1">
 *     <Label value="Face" />
 *     <Label value="Nose" />
 *   </KeyPointLabels>
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name KeyPointLabels
 * @param {string} name                  - name of the element
 * @param {string} toName                - name of the image to label
 * @param {float=} [opacity=0.9]         - opacity of keypoint
 * @param {string=} [fillColor]          - keypoint fill color, default is transparent
 * @param {number=} [strokeWidth=1]      - width of the stroke
 * @param {string=} [stokeColor=#8bad00] - keypoint stroke color
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const ModelAttrs = types
  .model("KeyPointLabelesModel", {
    // id: types.identifier,
    // pid: types.optional(types.string, guidGenerator),
    type: "keypointlabels",
    children: Types.unionArray(["label", "header", "view", "hypertext"]),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },
  }));

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  KeyPointModel,
  TagAttrs,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const KeyPointLabelsModel = types.compose("KeyPointLabelsModel", Composition);

const HtxKeyPointLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("keypointlabels", KeyPointLabelsModel, HtxKeyPointLabels);

export { HtxKeyPointLabels, KeyPointLabelsModel };
