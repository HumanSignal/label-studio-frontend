import React from "react";
import { Line } from "react-konva";
import { observer } from "mobx-react";
import { types, getParent, getRoot } from "mobx-state-tree";

import { guidGenerator } from "../../core/Helpers";
import { Vertex } from "./Vertex";

const Edge = types
  .model("Edge", {
    id: types.optional(types.identifier, guidGenerator),

    value: types.string,

    v1: types.string,
    v2: types.string,

    vertex1: types.maybeNull(Vertex),
    vertex2: types.maybeNull(Vertex),

    index: types.number,

    style: types.string,
    size: types.string,
  })
  .views(self => ({
    get parent() {
      return getParent(self, 2);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    addVertex(vert) {
      if (vert.value == self.v1) {
        self.vertex1 = vert;
      }

      // Not else if in the case that we have a loop
      if (vert.value == self.v2) {
        self.vertex2 = vert;
      }
    },
  }));

const EdgeView = observer(({ item, name }) => {
  const stroke = {
    small: 1,
    medium: 2,
    large: 3,
  };

  const fill = item.parent.fillColor ? item.parent.fillColor : "black";

  return (
    <Line
      name={name}
      key={name}
      points={[item.v1.x, item.v1.y, item.v2.x, item.v2.y]}
      tension={0}
      fill={fill}
      stroke={fill}
      strokeWidth={stroke[item.size]}
      strokeScaleEnabled={false}
      scaleX={1 / item.parent.parent.zoomScale || 1}
      scaleY={1 / item.parent.parent.zoomScale || 1}
      draggable={false}
    />
  );
});

export { Edge, EdgeView };
