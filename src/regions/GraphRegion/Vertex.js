import React from "react";
import { Rect, Circle } from "react-konva";
import { observer } from "mobx-react";
import { types, getParent, getRoot } from "mobx-state-tree";

import { guidGenerator } from "../../core/Helpers";

const Vertex = types
  .model("Vertex", {
    id: types.optional(types.identifier, guidGenerator),

    value: types.string,

    relativeX: types.optional(types.number, 0),
    relativeY: types.optional(types.number, 0),

    initX: types.optional(types.number, 0),
    initY: types.optional(types.number, 0),

    x: types.number,
    y: types.number,

    index: types.number,

    selected: types.optional(types.boolean, false),

    style: types.string,
    size: types.string,

    fillColor: types.optional(types.string, "white"),
    selColor: types.optional(types.string, "green"),
    occlColor: types.optional(types.string, "yellow"),
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
    /**
     * Triggered after create model
     */
    afterCreate() {
      self.initX = self.x;
      self.initY = self.y;

      if (self.parent.coordstype === "perc") {
        self.relativeX = self.x;
        self.relativeY = self.y;
      } else {
        self.relativeX = (self.x / self.parent.parent.stageWidth) * 100;
        self.relativeY = (self.y / self.parent.parent.stageHeight) * 100;
      }
    },

    /**
     * External function for Vertex Parent
     * @param {number} x
     * @param {number} y
     */

    moveVertex(offsetX, offsetY) {
      self.initX = self.initX + offsetX;
      self.initY = self.initY + offsetY;
      self.x = self.x + offsetX;
      self.y = self.y + offsetY;

      self.relativeX = (self.x / self.parent.parent.stageWidth) * 100;
      self.relativeY = (self.y / self.parent.parent.stageHeight) * 100;
    },

    _moveVertex(x, y) {
      self.initX = x;
      self.initY = y;

      self.relativeX = (x / self.parent.parent.stageWidth) * 100;
      self.relativeY = (y / self.parent.parent.stageHeight) * 100;

      self.x = x;
      self.y = y;
    },
  }));

const VertexView = observer(({ item, name }) => {
  const sizes = {
    small: 4,
    medium: 8,
    large: 12,
  };

  const stroke = {
    small: 1,
    medium: 2,
    large: 3,
  };

  const w = sizes[item.size];

  const dragOpts = {
    onDragMove: e => {
      let { x, y } = e.target.attrs;

      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x > item.parent.parent.stageWidth) x = item.parent.parent.stageWidth;
      if (y > item.parent.parent.stageHeight) y = item.parent.parent.stageHeight;

      item._moveVertex(x, y);
    },

    onDragEnd: e => {
      e.cancelBubble = true;
    },

    onMouseOver: e => {
      const stage = item.parent.parent.stageRef;
      stage.container().style.cursor = "crosshair";
    },

    onMouseOut: e => {
      const stage = item.parent.parent.stageRef;
      stage.container().style.cursor = "default";
    },
  };

  const fill = item.selected ? item.selColor : item.occluded ? item.occlColor : item.fillColor;

  if (item.style === "circle") {
    return (
      <Circle
        key={name}
        name={name}
        x={item.x}
        y={item.y}
        radius={w}
        fill={fill}
        stroke="black"
        strokeWidth={stroke[item.size]}
        dragOnTop={false}
        strokeScaleEnabled={false}
        scaleX={1 / (item.parent.parent.zoomScale || 1)}
        scaleY={1 / (item.parent.parent.zoomScale || 1)}
        onClick={ev => {
          item.parent.setSelectedVertex(item);
        }}
        {...dragOpts}
        draggable={item.parent.editable}
      />
    );
  } else {
    return (
      <Rect
        name={name}
        key={name}
        x={item.x - w / 2}
        y={item.y - w / 2}
        width={w}
        height={w}
        fill={fill}
        stroke="black"
        strokeWidth={stroke[item.size]}
        dragOnTop={false}
        {...dragOpts}
        draggable={item.parent.editable}
      />
    );
  }
});

export { Vertex, VertexView };
