import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { GraphModel } from "./Graph";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * GraphLabels tag, create labeled graphs
 * @example
 * <View>
 *   <Image name="image" value="$image" />
 *   <GraphLabels name="my-graphs" toName="image">
 *     <GraphLabel value="K2">
 *       <Vertex value="v1" />
 *       <Vertex value="v2" />
 *       <Edge value="1-2" v1="v1" v2="v2" />
 *     </GraphLabel>
 *   </GraphLabels>
 * </View>
 * @name GraphLabels
 * @param {string} name                             - name of tag
 * @param {string} toName                           - name of image to label
 * @param {number} [opacity=0.6]                    - opacity of graph
 * @param {string} [fillColor]                      - rectangle fill color, default is transparent
 * @param {string} [strokeColor]                    - stroke color
 * @param {number} [strokeWidth=1]                  - width of stroke
 * @param {small|medium|large} [vertexSize=medium]   - size of graph handle points
 * @param {rectangle|circle} [vertexStyle=rectangle] - style of points
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),
  choice: types.optional(types.enumeration(["single"]), "single"),
});

const ModelAttrs = types.model("GraphLabelsModel", {
  id: types.optional(types.identifier, guidGenerator),
  pid: types.optional(types.string, guidGenerator),
  type: "graphlabels",
  children: Types.unionArray(["graphlabel", "header", "view", "hypertext"]),
});

const Model = LabelMixin.props({ _type: "graphlabels" });

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  GraphModel,
  TagAttrs,
  Model,
  SelectedModelMixin.props({ _child: "GraphLabelModel" }),
  ControlBase,
);

const GraphLabelsModel = types.compose("GraphLabelsModel", Composition);

const HtxGraphLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("graphlabels", GraphLabelsModel, HtxGraphLabels);

export { HtxGraphLabels, GraphLabelsModel };
