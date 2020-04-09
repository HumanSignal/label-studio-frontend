import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import RequiredMixin from "../../mixins/Required";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * TimeSeriesLabels tag
 * TimeSeriesLabels tag creates labeled keypoints
 * @example
 * <View>
 *   <TimeSeriesLabels name="kp-1" toName="img-1">
 *     <Label value="Face"></Label>
 *     <Label value="Nose"></Label>
 *   </TimeSeriesLabels>
 *   <TimeSeries name="img-1" value="$time">
 *     <TimeSeriesChannel value="$col" />
 *   </TimeSeries>
 * </View>
 * @name TimeSeriesLabels
 * @param {string} name name of the element
 * @param {string} toname name of the image to label
 * @param {float=} [opacity=0.9] opacity of keypoint
 * @param {string=} fillColor keypoint fill color, default is transparent
 * @param {number=} [strokeWidth=1] width of the stroke
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),

  opacity: types.optional(types.string, "0.9"),
  fillcolor: types.maybeNull(types.string),

  strokeWidth: types.optional(types.number, 1),
  strokeColor: types.optional(types.string, "#f48a42"),
});

const ModelAttrs = types
  .model("TimeSeriesLabelesModel", {
    id: types.identifier,
    pid: types.optional(types.string, guidGenerator),
    type: "timeserieslabels",
    children: Types.unionArray(["labels", "label", "choice"]),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      return states ? states.filter(c => c.isSelected === true) : null;
    },
  }));

const Model = LabelMixin.props({ _type: "timeserieslabels" }).views(self => ({
  get shouldBeUnselected() {
    return self.choice === "single";
  },
}));

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  TagAttrs,
  Model,
  RequiredMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const TimeSeriesLabelsModel = types.compose("TimeSeriesLabelsModel", Composition);

const HtxTimeSeriesLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("timeserieslabels", TimeSeriesLabelsModel, HtxTimeSeriesLabels);

export { HtxTimeSeriesLabels, TimeSeriesLabelsModel };
