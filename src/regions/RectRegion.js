import React, { Fragment } from "react";
import { Rect } from "react-konva";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getParent, getRoot } from "mobx-state-tree";

import Constants from "../core/Constants";
import DisabledMixin from "../mixins/Normalization";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { ChoicesModel } from "../tags/control/Choices";
import { ImageModel } from "../tags/object/Image";
import { LabelOnRect } from "../components/ImageView/LabelOnRegion";
import { RatingModel } from "../tags/control/Rating";
import { RectangleLabelsModel } from "../tags/control/RectangleLabels";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";

/**
 * Rectangle object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "rectangleregion",

    x: types.number,
    y: types.number,

    relativeX: types.optional(types.number, 0),
    relativeY: types.optional(types.number, 0),

    relativeWidth: types.optional(types.number, 0),
    relativeHeight: types.optional(types.number, 0),

    startX: types.optional(types.number, 0),
    startY: types.optional(types.number, 0),

    width: types.number,
    height: types.number,

    // @todo not used
    scaleX: types.optional(types.number, 1),
    scaleY: types.optional(types.number, 1),

    rotation: types.optional(types.number, 0),

    opacity: types.number,

    fill: types.optional(types.boolean, true),
    fillColor: types.optional(types.string, Constants.FILL_COLOR),
    fillOpacity: types.optional(types.number, 0.6),

    strokeColor: types.optional(types.string, Constants.STROKE_COLOR),
    strokeWidth: types.optional(types.number, Constants.STROKE_WIDTH),

    states: types.maybeNull(types.array(types.union(RectangleLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),

    wp: types.maybeNull(types.number),
    hp: types.maybeNull(types.number),

    sw: types.maybeNull(types.number),
    sh: types.maybeNull(types.number),

    coordstype: types.optional(types.enumeration(["px", "perc"]), "px"),

    supportsTransform: true,
    // depends on region and object tag; they both should correctly handle the `hidden` flag
    hideable: true,
  })
  .views(self => ({
    get store() {
      return getRoot(self);
    },
    get parent() {
      return getParentOfType(self, ImageModel);
    },
  }))
  .actions(self => ({
    afterCreate() {
      self.startX = self.x;
      self.startY = self.y;

      if (self.coordstype === "perc") {
        self.relativeX = self.x;
        self.relativeY = self.y;
        self.relativeWidth = self.width;
        self.relativeHeight = self.height;
      }

      self.updateAppearenceFromState();
    },

    updateAppearenceFromState() {
      if (self.states && self.states.length) {
        const stroke = self.states[0].getSelectedColor();
        self.strokeColor = stroke;
        self.fillColor = stroke;
      }
    },

    rotate(degree) {
      const p = self.rotatePoint(self, degree);
      if (degree === -90) p.y -= self.width;
      if (degree === 90) p.x -= self.height;
      self.setPosition(p.x, p.y, self.height, self.width, self.rotation);
    },

    // @todo not used
    coordsInside(x, y) {
      // check if x and y are inside the rectangle
      const rx = self.x;
      const ry = self.y;
      const rw = self.width * (self.scaleX || 1);
      const rh = self.height * (self.scaleY || 1);

      if (x > rx && x < rx + rw && y > ry && y < ry + rh) return true;

      return false;
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self.parent.setSelected(self.id);

      self.completion.loadRegionState(self);
    },

    /**
     * Boundg Box set position on canvas
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} rotation
     */
    setPosition(x, y, width, height, rotation) {
      self.x = x;
      self.y = y;
      self.width = width;
      self.height = height;

      self.relativeX = (x / self.parent.stageWidth) * 100;
      self.relativeY = (y / self.parent.stageHeight) * 100;

      self.relativeWidth = (width / self.parent.stageWidth) * 100;
      self.relativeHeight = (height / self.parent.stageHeight) * 100;

      self.rotation = (rotation + 360) % 360;
    },

    setScale(x, y) {
      self.scaleX = x;
      self.scaleY = y;
    },

    addState(state) {
      self.states.push(state);
    },

    setFill(color) {
      self.fill = color;
    },

    updateImageSize(wp, hp, sw, sh) {
      self.wp = wp;
      self.hp = hp;

      self.sw = sw;
      self.sh = sh;

      if (self.coordstype === "px") {
        self.x = (sw * self.relativeX) / 100;
        self.y = (sh * self.relativeY) / 100;
        self.width = (sw * self.relativeWidth) / 100;
        self.height = (sh * self.relativeHeight) / 100;
      } else if (self.coordstype === "perc") {
        self.x = (sw * self.x) / 100;
        self.y = (sh * self.y) / 100;
        self.width = (sw * self.width) / 100;
        self.height = (sh * self.height) / 100;
        self.coordstype = "px";
      }
    },

    serialize(control, object) {
      const value = control.serializableValue;
      if (!value) return null;

      const degree = (360 - self.parent.rotation) % 360;
      let { x, y } = self.rotatePoint(self, degree, false);
      if (degree === 270) y -= self.width;
      if (degree === 90) x -= self.height;
      if (degree === 180) {
        x -= self.width;
        y -= self.height;
      }

      const natural = self.rotateDimensions({ width: object.naturalWidth, height: object.naturalHeight }, degree);
      const stage = self.rotateDimensions({ width: object.stageWidth, height: object.stageHeight }, degree);
      const { width, height } = self.rotateDimensions(
        {
          width: (self.width * (self.scaleX || 1) * 100) / object.stageWidth, //  * (self.scaleX || 1)
          height: (self.height * (self.scaleY || 1) * 100) / object.stageHeight,
        },
        degree,
      );

      return {
        original_width: natural.width,
        original_height: natural.height,
        image_rotation: self.parent.rotation,
        value: {
          x: (x * 100) / stage.width,
          y: (y * 100) / stage.height,
          width,
          height,
          rotation: self.rotation,
          ...value,
        },
      };
    },
  }));

const RectRegionModel = types.compose(
  "RectRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  DisabledMixin,
  Model,
);

const HtxRectangleView = ({ store, item }) => {
  let { strokeColor, strokeWidth } = item;
  if (item.highlighted) {
    strokeColor = Constants.HIGHLIGHTED_STROKE_COLOR;
    strokeWidth = Constants.HIGHLIGHTED_STROKE_WIDTH;
  }

  if (item.hidden) return null;

  return (
    <Fragment>
      <Rect
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        fill={item.fill ? Utils.Colors.convertToRGBA(item.fillColor, item.fillOpacity) : null}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeScaleEnabled={false}
        shadowBlur={0}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        opacity={item.opacity}
        rotation={item.rotation}
        name={item.id}
        onTransformEnd={e => {
          const t = e.target;

          item.setPosition(
            t.getAttr("x"),
            t.getAttr("y"),
            t.getAttr("width") * t.getAttr("scaleX"),
            t.getAttr("height") * t.getAttr("scaleY"),
            t.getAttr("rotation"),
          );

          t.setAttr("scaleX", 1);
          t.setAttr("scaleY", 1);
        }}
        onDragEnd={e => {
          const t = e.target;

          item.setPosition(
            t.getAttr("x"),
            t.getAttr("y"),
            t.getAttr("width"),
            t.getAttr("height"),
            t.getAttr("rotation"),
          );
          item.setScale(t.getAttr("scaleX"), t.getAttr("scaleY"));
        }}
        dragBoundFunc={item.parent.fixForZoom(pos => {
          let { x, y } = pos;
          let { stageHeight, stageWidth } = getParent(item, 2);

          if (x <= 0) {
            x = 0;
          } else if (x + item.width >= stageWidth) {
            x = stageWidth - item.width;
          }

          if (y < 0) {
            y = 0;
          } else if (y + item.height >= stageHeight) {
            y = stageHeight - item.height;
          }

          return { x, y };
        })}
        onMouseOver={e => {
          const stage = item.parent.stageRef;

          if (store.completionStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = Constants.RELATION_MODE_CURSOR;
          } else {
            stage.container().style.cursor = Constants.POINTER_CURSOR;
          }
        }}
        onMouseOut={e => {
          const stage = item.parent.stageRef;
          stage.container().style.cursor = Constants.DEFAULT_CURSOR;

          if (store.completionStore.selected.relationMode) {
            item.setHighlight(false);
          }
        }}
        onClick={e => {
          const stage = item.parent.stageRef;
          if (!item.completion.editable) return;

          if (store.completionStore.selected.relationMode) {
            stage.container().style.cursor = Constants.DEFAULT_CURSOR;
          }

          item.setHighlight(false);
          item.onClickRegion();
        }}
        draggable={item.editable}
      />
      <LabelOnRect item={item} />
    </Fragment>
  );
};

const HtxRectangle = inject("store")(observer(HtxRectangleView));

Registry.addTag("rectangleregion", RectRegionModel, HtxRectangle);

export { RectRegionModel, HtxRectangle };
