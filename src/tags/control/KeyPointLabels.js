import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { KeyPointModel } from "./KeyPoint";
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
 * @param {string} name                  - Name of the element
 * @param {string} toName                - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum available uses of the label
 * @param {boolean} [showInline=true]        - Show items in the same visual line
 * @param {float=} [opacity=0.9]         - Opacity of the keypoint
 * @param {string=} [fillColor=#f48a42]          - Keypoint fill color
 * @param {number=} [strokeWidth=1]      - Width of the stroke
 * @param {string=} [stokeColor=#8bad00] - Keypoint stroke color
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types
  .model("KeyPointLabelesModel", {
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
  Validation,
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
