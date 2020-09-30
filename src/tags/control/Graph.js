import { observer, inject } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";

/**
 * Graph tag
 * Graph is used to add graphs to an image
 * @example
 * <View>
 *   <Graph name="graph-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Graph
 * @param {string} name                           - name of tag
 * @param {string} toname                         - name of image to label
 * @param {number} [opacity=0.6]                  - opacity of graph
 * @param {string} [fillColor]                    - rectangle fill color, default is transparent
 * @param {string} [strokeColor]                  - stroke color
 * @param {number} [strokeWidth=1]                - width of stroke
 * @param {small|medium|large} [pointSize=medium] - size of graph handle points
 * @param {rectangle|circle} [pointStyle=circle]  - style of points
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),

  opacity: types.optional(types.string, "0.6"),
  fillcolor: types.optional(types.string, "#f48a42"),

  strokewidth: types.optional(types.string, "3"),
  strokecolor: types.optional(types.string, "#f48a42"),

  vertexsize: types.optional(types.string, "small"),
  vertexstyle: types.optional(types.string, "circle"),
});

const Model = types
  .model({
    id: types.identifier,
    type: "graph",

    _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    fromStateJSON() {},

    afterCreate() {
      const graph = Tools.Graph.create();

      graph._control = self;

      self.tools = {
        graph: graph,
      };
    },
  }));

const GraphModel = types.compose("GraphModel", ControlBase, TagAttrs, Model);

const HtxView = inject("store")(
  observer(({ store, item }) => {
    return null;
  }),
);

Registry.addTag("graph", GraphModel, HtxView);

export { HtxView, GraphModel };
