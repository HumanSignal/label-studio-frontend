import React from "react";
import { Rect, Circle } from "react-konva";
import { observer } from "mobx-react";
import { types, getParent, getRoot } from "mobx-state-tree";

import { guidGenerator } from "../core/Helpers";

const PolygonPoint = types
  .model("PolygonPoint", {
    id: types.optional(types.identifier, guidGenerator),

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
     * External function for Polygon Parent
     * @param {number} x
     * @param {number} y
     */

    movePoint(offsetX, offsetY) {
      self.initX = self.initX + offsetX;
      self.initY = self.initY + offsetY;
      self.x = self.x + offsetX;
      self.y = self.y + offsetY;

      self.relativeX = (self.x / self.parent.parent.stageWidth) * 100;
      self.relativeY = (self.y / self.parent.parent.stageHeight) * 100;
    },

    _movePoint(x, y) {
      self.initX = x;
      self.initY = y;

      self.relativeX = (x / self.parent.parent.stageWidth) * 100;
      self.relativeY = (y / self.parent.parent.stageHeight) * 100;

      self.x = x;
      self.y = y;
    },

    /**
     * Close polygon
     * @param {*} ev
     */
    closeStartPoint(ev) {
      if (!self.completion.editable) return;

      if (self.parent.mouseOverStartPoint) {
        self.parent.closePoly();
      }
    },

    handleMouseOverStartPoint(ev) {
      const stage = self.parent.parent.stageRef;

      stage.container().style.cursor = "crosshair";

      /**
       * Check if polygon > 2 points and closed point
       */
      if (self.parent.closed || self.parent.points.length < 3) return;

      const startPoint = ev.target;

      if (self.style === "rectangle") {
        startPoint.setX(startPoint.x() - startPoint.width() / 2);
        startPoint.setY(startPoint.y() - startPoint.height() / 2);
      }

      const scaleMap = {
        small: 2,
        medium: 3,
        large: 4,
      };

      const scale = scaleMap[self.size];

      startPoint.scale({
        x: scale / self.parent.parent.zoomScale,
        y: scale / self.parent.parent.zoomScale,
      });

      self.parent.setMouseOverStartPoint(true);
    },

    handleMouseOutStartPoint(ev) {
      const t = ev.target;

      const stage = self.parent.parent.stageRef;
      stage.container().style.cursor = "default";

      if (self.style === "rectangle") {
        t.setX(t.x() + t.width() / 2);
        t.setY(t.y() + t.height() / 2);
      }

      t.scale({
        x: 1 / self.parent.parent.zoomScale,
        y: 1 / self.parent.parent.zoomScale,
      });

      self.parent.setMouseOverStartPoint(false);
    },
  }));

const PolygonPointView = observer(({ item, name }) => {
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

  const startPointAttr =
    item.index === 0
      ? {
          hitStrokeWidth: 12,
          fill: item.parent.strokeColor ? item.parent.strokeColor : item.primary,
          onMouseOver: item.handleMouseOverStartPoint,
          onMouseOut: item.handleMouseOutStartPoint,
          onClick: item.closeStartPoint,
        }
      : null;

  const dragOpts = {
    onDragMove: e => {
      let { x, y } = e.target.attrs;

      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x > item.parent.parent.stageWidth) x = item.parent.parent.stageWidth;
      if (y > item.parent.parent.stageHeight) y = item.parent.parent.stageHeight;

      item._movePoint(x, y);
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

  const fill = item.selected ? "green" : "white";

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
          if (item.parent.mouseOverStartPoint) {
            item.parent.closePoly();
          } else {
            // ev.evt.preventDefault();
            // ev.cancelBubble = true;
            item.parent.setSelectedPoint(item);
          }
        }}
        {...dragOpts}
        {...startPointAttr}
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
        {...startPointAttr}
        draggable={item.parent.editable}
      />
    );
  }
});

export { PolygonPoint, PolygonPointView };
