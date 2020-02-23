import React, { Fragment } from "react";
import { Ellipse } from "react-konva";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getParent, getRoot } from "mobx-state-tree";
import { sin, cos, pow, abs, unit } from "mathjs";

import Constants from "../core/Constants";
import DisabledMixin from "../mixins/Normalization";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import Utils from "../utils";
import { ImageModel } from "../tags/object/Image";
import { LabelsModel } from "../tags/control/Labels";
import { RatingModel } from "../tags/control/Rating";
import { EllipseLabelsModel } from "../tags/control/EllipseLabels";
import { guidGenerator } from "../core/Helpers";

/**
 * Ellipse object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.identifier,
    pid: types.optional(types.string, guidGenerator),

    type: "ellipseregion",

    x: types.number,
    y: types.number,

    relativeX: types.optional(types.number, 0),
    relativeY: types.optional(types.number, 0),

    relativeWidth: types.optional(types.number, 0),
    relativeHeight: types.optional(types.number, 0),

    _start_x: types.optional(types.number, 0),
    _start_y: types.optional(types.number, 0),

    relativeRadiusX: types.optional(types.number, 0),
    relativeRadiusY: types.optional(types.number, 0),

    radiusX: types.number,
    radiusY: types.number,

    scaleX: types.optional(types.number, 1),
    scaleY: types.optional(types.number, 1),

    rotation: types.optional(types.number, 0),

    opacity: types.number,

    fill: types.optional(types.boolean, true),
    fillcolor: types.optional(types.string, Constants.FILL_COLOR),

    strokeColor: types.optional(types.string, Constants.STROKE_COLOR),
    strokeWidth: types.optional(types.number, Constants.STROKE_WIDTH),

    states: types.maybeNull(types.array(types.union(LabelsModel, RatingModel, EllipseLabelsModel))),

    wp: types.maybeNull(types.number),
    hp: types.maybeNull(types.number),

    sw: types.maybeNull(types.number),
    sh: types.maybeNull(types.number),

    coordstype: types.optional(types.enumeration(["px", "perc"]), "px"),

    supportsTransform: true,
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, ImageModel);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    afterCreate() {
      self._start_x = self.x;
      self._start_y = self.y;

      if (self.coordstype === "perc") {
        self.relativeX = self.x;
        self.relativeY = self.y;
        self.relativeRadiusX = self.radiusX;
        self.relativeRadiusY = self.radiusY;
        self.relativeWidth = self.width;
        self.relativeHeight = self.height;
      }
    },

    unselectRegion() {
      self.selected = false;
      self.parent.setSelected(undefined);
      self.completion.setHighlightedNode(null);
    },

    coordsInside(x, y) {
      // check if x and y are inside the rectangle
      const a = self.radiusX;
      const b = self.radiusY;

      const cx = self.x;
      const cy = self.y;
      //going to system where center coordinates are (0,0)
      var rel_x = x - cx;
      var rel_y = y - cy;

      //going to system where our ellipse has angle 0 to X-Axis via rotate matrix
      const theta = self.rotation;
      rel_x = rel_x * cos(unit(theta, "deg")) - rel_y * sin(unit(theta, "deg"));
      rel_y = rel_x * sin(unit(theta, "deg")) + rel_y * cos(unit(theta, "deg"));

      if (abs(rel_x) < a) {
        if (pow(rel_y, 2) < pow(b, 2) * (1 - pow(rel_x, 2) / pow(a, 2))) {
          return true;
        }
      } else {
        return false;
      }
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self.parent.setSelected(self.id);
    },

    /**
     * Boundg Box set position on canvas
     * @param {number} x
     * @param {number} y
     * @param {number} radiusX
     * @param {number} radiusY
     * @param {number} rotation
     */
    setPosition(x, y, radiusX, radiusY, rotation) {
      self.x = x;
      self.y = y;
      self.radiusX = radiusX;
      self.radiusY = radiusY;

      self.relativeX = (x / self.parent.stageWidth) * 100;
      self.relativeY = (y / self.parent.stageHeight) * 100;

      self.relativeRadiusX = (radiusX / self.parent.stageWidth) * 100;
      self.relativeRadiusY = (radiusY / self.parent.stageHeight) * 100;

      if (rotation < 0) {
        self.rotation = (rotation % 360) + 360;
      } else {
        self.rotation = rotation % 360;
      }
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
        self.radiusX = (sw * self.relativeRadiusX) / 100;
        self.radiusY = (sh * self.relativeRadiusY) / 100;
      } else if (self.coordstype === "perc") {
        self.x = (sw * self.x) / 100;
        self.y = (sh * self.y) / 100;
        self.radiusX = (sw * self.radiusX) / 100;
        self.radiusY = (sh * self.radiusY) / 100;
        self.coordstype = "px";
      }
    },

    /**
     * Format for sending to server
     */
    toStateJSON() {
      const parent = self.parent;
      let fromEl = parent.states()[0];

      if (parent.states().length > 1) {
        parent.states().forEach(state => {
          if (state.type === "ellipselabels") {
            fromEl = state;
          }
        });
      }

      const buildTree = obj => {
        const tree = {
          id: self.id,
          from_name: fromEl.name,
          to_name: parent.name,
          source: parent.value,
          type: "ellipse",
          value: {
            x: (self.x * 100) / self.parent.stageWidth,
            y: (self.y * 100) / self.parent.stageHeight,
            radiusX: (self.radiusX * (self.scaleX || 1) * 100) / self.parent.stageWidth, //  * (self.scaleX || 1)
            radiusY: (self.radiusY * (self.scaleY || 1) * 100) / self.parent.stageHeight,
            rotation: self.rotation,
          },
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states.map(s => {
          const tree = buildTree(s);
          // in case of labels it's gonna be, labels: ["label1", "label2"]
          tree["value"][s.type] = s.getSelectedNames();
          tree["type"] = s.type;

          return tree;
        });
      } else {
        return buildTree(parent);
      }
    },
  }));

const EllipseRegionModel = types.compose("EllipseRegionModel", RegionsMixin, NormalizationMixin, DisabledMixin, Model);

const HtxEllipseView = ({ store, item }) => {
  let { strokeColor, strokeWidth } = item;
  if (item.highlighted) {
    strokeColor = Constants.HIGHLIGHTED_STROKE_COLOR;
    strokeWidth = Constants.HIGHLIGHTED_STROKE_WIDTH;
  }
  return (
    <Fragment>
      <Ellipse
        x={item.x}
        y={item.y}
        radiusX={item.radiusX}
        radiusY={item.radiusY}
        fill={item.fill ? Utils.Colors.convertToRGBA(item.fillcolor, 0.4) : null}
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
            t.getAttr("radiusX") * t.getAttr("scaleX"),
            t.getAttr("radiusY") * t.getAttr("scaleY"),
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
            t.getAttr("radiusX"),
            t.getAttr("radiusY"),
            t.getAttr("rotation"),
          );
          item.setScale(t.getAttr("scaleX"), t.getAttr("scaleY"));
        }}
        dragBoundFunc={(pos, e) => {
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

          return {
            x: x,
            y: y,
          };
        }}
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
          if (!item.completion.edittable) return;

          if (store.completionStore.selected.relationMode) {
            stage.container().style.cursor = Constants.DEFAULT_CURSOR;
          }

          item.setHighlight(false);
          item.onClickRegion();
        }}
        draggable={item.completion.edittable}
      />
    </Fragment>
  );
};

const HtxEllipse = inject("store")(observer(HtxEllipseView));

Registry.addTag("ellipseregion", EllipseRegionModel, HtxEllipse);

export { EllipseRegionModel, HtxEllipse };
