import React, { Fragment } from "react";
import { Ellipse } from "react-konva";
import { observer } from "mobx-react";
import { types, getRoot, isAlive } from "mobx-state-tree";
import WithStatesMixin from "../mixins/WithStates";
import Constants, { defaultStyle } from "../core/Constants";
import DisabledMixin from "../mixins/Normalization";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import Utils from "../utils";
import { ImageModel } from "../tags/object/Image";
import { guidGenerator } from "../core/Helpers";
import { LabelOnEllipse } from "../components/ImageView/LabelOnRegion";
import { AreaMixin } from "../mixins/AreaMixin";
import { getBoundingBoxAfterChanges, fixRectToFit } from "../utils/image";

/**
 * Ellipse object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "ellipseregion",
    object: types.late(() => types.reference(ImageModel)),

    x: types.number,
    y: types.number,

    radiusX: types.number,
    radiusY: types.number,

    rotation: 0,

    coordstype: types.optional(types.enumeration(["px", "perc"]), "perc"),
  })
  .volatile(self => ({
    relativeX: 0,
    relativeY: 0,

    relativeWidth: 0,
    relativeHeight: 0,

    startX: 0,
    startY: 0,

    relativeRadiusX: 0,
    relativeRadiusY: 0,

    // @todo not used
    scaleX: 1,
    scaleY: 1,

    opacity: types.number,

    fill: true,
    fillColor: Constants.FILL_COLOR,
    fillOpacity: 0.6,

    strokeColor: Constants.STROKE_COLOR,
    strokeWidth: Constants.STROKE_WIDTH,

    supportsTransform: true,
    hideable: true,
  }))
  .views(self => ({
    get store() {
      return getRoot(self);
    },
  }))
  .actions(self => ({
    afterCreate() {
      self.startX = self.x;
      self.startY = self.y;

      if (self.coordstype === "perc") {
        self.relativeX = self.x;
        self.relativeY = self.y;
        self.relativeRadiusX = self.radiusX;
        self.relativeRadiusY = self.radiusY;
        self.relativeWidth = self.width;
        self.relativeHeight = self.height;
      }

      self.updateAppearenceFromState();
    },

    // @todo not used
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
      rel_x = rel_x * Math.cos(Math.unit(theta, "deg")) - rel_y * Math.sin(Math.unit(theta, "deg"));
      rel_y = rel_x * Math.sin(Math.unit(theta, "deg")) + rel_y * Math.cos(Math.unit(theta, "deg"));

      if (Math.abs(rel_x) < a) {
        if (Math.pow(rel_y, 2) < Math.pow(b, 2) * (1 - Math.pow(rel_x, 2) / Math.pow(a, 2))) {
          return true;
        }
      } else {
        return false;
      }
    },

    // @todo not used
    rotate(degree) {
      const p = self.rotatePoint(self, degree);
      self.setPosition(p.x, p.y, self.radiusY, self.radiusX, self.rotation);
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

      self.rotation = (rotation + 360) % 360;
    },

    setScale(x, y) {
      self.scaleX = x;
      self.scaleY = y;
    },

    setFill(color) {
      self.fill = color;
    },

    updateImageSize(wp, hp, sw, sh) {
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

    serialize() {
      const res = {
        original_width: self.parent.naturalWidth,
        original_height: self.parent.naturalHeight,
        image_rotation: self.parent.rotation,
        value: {
          x: self.convertXToPerc(self.x),
          y: self.convertYToPerc(self.y),
          radiusX: self.convertHDimensionToPerc(self.radiusX),
          radiusY: self.convertVDimensionToPerc(self.radiusY),
          rotation: self.rotation,
        },
      };

      return res;
    },
  }));

const EllipseRegionModel = types.compose(
  "EllipseRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  DisabledMixin,
  Model,
);

const HtxEllipseView = ({ item }) => {
  if (!isAlive(item)) return null;
  if (item.hidden) return null;

  const { store } = item;

  const style = item.style || item.tag || defaultStyle;
  let { strokecolor, strokewidth } = style;

  if (item.highlighted) {
    strokecolor = Constants.HIGHLIGHTED_STROKE_COLOR;
    strokewidth = Constants.HIGHLIGHTED_STROKE_WIDTH;
  }

  return (
    <Fragment>
      <Ellipse
        x={item.x}
        y={item.y}
        radiusX={item.radiusX}
        radiusY={item.radiusY}
        fill={item.fill ? Utils.Colors.convertToRGBA(style.fillcolor, +style.fillopacity) : null}
        stroke={strokecolor}
        strokeWidth={+strokewidth}
        strokeScaleEnabled={false}
        shadowBlur={0}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        opacity={+style.opacity}
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
        dragBoundFunc={item.parent.fixForZoom(pos => {
          let { x, y } = pos;
          const { radiusX, radiusY, rotation } = item;
          const { stageHeight, stageWidth } = item.parent;
          const selfRect = { x: -radiusX, y: -radiusY, width: radiusX * 2, height: radiusY * 2 };
          const box = getBoundingBoxAfterChanges(selfRect, { x, y }, rotation);
          const fixed = fixRectToFit(box, stageWidth, stageHeight);

          if (fixed.width !== box.width) {
            x += (fixed.width - box.width) * (fixed.x !== box.x ? -1 : 1);
          }

          if (fixed.height !== box.height) {
            y += (fixed.height - box.height) * (fixed.y !== box.y ? -1 : 1);
          }

          return { x, y };
        })}
        onMouseOver={e => {
          const stage = item.parent.stageRef;

          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = Constants.RELATION_MODE_CURSOR;
          } else {
            stage.container().style.cursor = Constants.POINTER_CURSOR;
          }
        }}
        onMouseOut={e => {
          const stage = item.parent.stageRef;
          stage.container().style.cursor = Constants.DEFAULT_CURSOR;

          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(false);
          }
        }}
        onClick={e => {
          const stage = item.parent.stageRef;
          if (!item.annotation.editable) return;

          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = Constants.DEFAULT_CURSOR;
          }

          item.setHighlight(false);
          item.onClickRegion();
        }}
        draggable={item.editable}
      />
      <LabelOnEllipse item={item} />
    </Fragment>
  );
};

const HtxEllipse = observer(HtxEllipseView);

Registry.addTag("ellipseregion", EllipseRegionModel, HtxEllipse);
Registry.addRegionType(EllipseRegionModel, "image");

export { EllipseRegionModel, HtxEllipse };
