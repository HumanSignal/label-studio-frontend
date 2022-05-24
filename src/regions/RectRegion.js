import { getRoot, types } from "mobx-state-tree";
import React, { useContext } from "react";
import { Rect } from "react-konva";
import { ImageViewContext } from "../components/ImageView/ImageViewContext";
import { LabelOnRect } from "../components/ImageView/LabelOnRegion";
import Constants from "../core/Constants";
import { guidGenerator } from "../core/Helpers";
import Registry from "../core/Registry";
import { useRegionStyles } from "../hooks/useRegionColor";
import { AreaMixin } from "../mixins/AreaMixin";
import { KonvaRegionMixin } from "../mixins/KonvaRegion";
import { default as DisabledMixin, default as NormalizationMixin } from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import WithStatesMixin from "../mixins/WithStates";
import { ImageModel } from "../tags/object/Image";
import { rotateBboxCoords } from "../utils/bboxCoords";
import { createDragBoundFunc, fixRectToFit, getBoundingBoxAfterChanges } from "../utils/image";
import { AliveRegion } from "./AliveRegion";
import { EditableRegion } from "./EditableRegion";
import { RegionWrapper } from "./RegionWrapper";


/**
 * Rectangle object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "rectangleregion",
    object: types.late(() => types.reference(ImageModel)),

    x: types.number,
    y: types.number,

    width: types.number,
    height: types.number,

    rotation: 0,
    coordstype: types.optional(types.enumeration(["px", "perc"]), "perc"),
  })
  .volatile(() => ({
    relativeX: 0,
    relativeY: 0,

    relativeWidth: 0,
    relativeHeight: 0,

    startX: 0,
    startY: 0,

    // @todo not used
    scaleX: 1,
    scaleY: 1,

    opacity: 1,

    fill: true,
    fillColor: "#ff8800", // Constants.FILL_COLOR,
    fillOpacity: 0.2,

    strokeColor: Constants.STROKE_COLOR,
    strokeWidth: Constants.STROKE_WIDTH,

    _supportsTransform: true,
    // depends on region and object tag; they both should correctly handle the `hidden` flag
    hideable: true,

    editableFields: [
      { property: "x", label: "X" },
      { property: "y", label: "Y" },
      { property: "width", label: "W" },
      { property: "height", label: "H" },
      { property: "rotation", label: "icon:angle" },
    ],
  }))
  .volatile(() => {
    return {
      useTransformer: true,
      preferTransformer: true,
      supportsRotate: true,
      supportsScale: true,
    };
  })
  .views(self => ({
    get store() {
      return getRoot(self);
    },
    get parent() {
      return self.object;
    },
    get bboxCoords() {
      const bboxCoords= {
        left: self.x,
        top: self.y,
        right: self.x + self.width,
        bottom: self.y + self.height,
      };

      return self.rotation !== 0 ? rotateBboxCoords(bboxCoords, self.rotation) : bboxCoords;
    },
  }))
  .actions(self => ({
    afterCreate() {
      self.startX = self.x;
      self.startY = self.y;

      switch (self.coordstype)  {
        case "perc": {
          self.relativeX = self.x;
          self.relativeY = self.y;
          self.relativeWidth = self.width;
          self.relativeHeight = self.height;
          break;
        }
        case "px": {
          const { stageWidth, stageHeight } = self.parent;

          if (stageWidth && stageHeight) {
            self.setPosition(self.x, self.y, self.width, self.height, self.rotation);
          }
          break;
        }
      }
      self.checkSizes();
      self.updateAppearenceFromState();
    },

    // @todo not used
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

    /**
     * Bounding Box set position on canvas
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

      self.relativeX = (x / self.parent?.stageWidth) * 100;
      self.relativeY = (y / self.parent?.stageHeight) * 100;

      self.relativeWidth = (width / self.parent?.stageWidth) * 100;
      self.relativeHeight = (height / self.parent?.stageHeight) * 100;

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

    /**
     * @example
     * {
     *   "original_width": 1920,
     *   "original_height": 1280,
     *   "image_rotation": 0,
     *   "value": {
     *     "x": 3.1,
     *     "y": 8.2,
     *     "width": 20,
     *     "height": 16,
     *     "rectanglelabels": ["Car"]
     *   }
     * }
     * @typedef {Object} RectRegionResult
     * @property {number} original_width width of the original image (px)
     * @property {number} original_height height of the original image (px)
     * @property {number} image_rotation rotation degree of the image (deg)
     * @property {Object} value
     * @property {number} value.x x coordinate of the top left corner before rotation (0-100)
     * @property {number} value.y y coordinate of the top left corner before rotation (0-100)
     * @property {number} value.width width of the bounding box (0-100)
     * @property {number} value.height height of the bounding box (0-100)
     * @property {number} value.rotation rotation degree of the bounding box (deg)
     */

    /**
     * @return {RectRegionResult}
     */
    serialize() {
      return {
        original_width: self.parent.naturalWidth,
        original_height: self.parent.naturalHeight,
        image_rotation: self.parent.rotation,
        value: {
          x: self.convertXToPerc(self.x),
          y: self.convertYToPerc(self.y),
          width: self.convertHDimensionToPerc(self.width),
          height: self.convertVDimensionToPerc(self.height),
          rotation: self.rotation,
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
  AreaMixin,
  KonvaRegionMixin,
  EditableRegion,
  Model,
);

const HtxRectangleView = ({ item }) => {
  const { store } = item;

  const { suggestion } = useContext(ImageViewContext) ?? {};
  const regionStyles = useRegionStyles(item, { suggestion });
  const stage = item.parent.stageRef;

  const eventHandlers = {};

  if (!suggestion && item.editable) {
    eventHandlers.onTransform = ({ target }) => {
      // resetting the skew makes transformations weird but predictable
      target.setAttr("skewX", 0);
      target.setAttr("skewY", 0);
    };
    eventHandlers.onTransformEnd = (e) => {
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

      item.notifyDrawingFinished();
    };

    eventHandlers.onDragStart = (e) => {
      if (item.parent.getSkipInteractions()) {
        e.currentTarget.stopDrag(e.evt);
        return;
      }
      item.annotation.history.freeze(item.id);
    };

    eventHandlers.onDragEnd = (e) => {
      const t = e.target;

      item.setPosition(
        t.getAttr("x"),
        t.getAttr("y"),
        t.getAttr("width"),
        t.getAttr("height"),
        t.getAttr("rotation"),
      );
      item.setScale(t.getAttr("scaleX"), t.getAttr("scaleY"));
      item.annotation.history.unfreeze(item.id);

      item.notifyDrawingFinished();
    };

    eventHandlers.dragBoundFunc = createDragBoundFunc(item, { x: item.x - item.bboxCoords.left, y: item.y - item.bboxCoords.top });
  }

  return (
    <RegionWrapper item={item}>
      <Rect
        x={item.x}
        y={item.y}
        ref={node => item.setShapeRef(node)}
        width={item.width}
        height={item.height}
        fill={regionStyles.fillColor}
        stroke={regionStyles.strokeColor}
        strokeWidth={regionStyles.strokeWidth}
        strokeScaleEnabled={false}
        shadowBlur={0}
        dash={suggestion ? [10, 10] : null}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        opacity={1}
        rotation={item.rotation}
        draggable={item.editable}
        name={`${item.id} _transformable`}
        {...eventHandlers}
        onMouseOver={() => {
          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(true);
            stage.container().style.cursor = Constants.RELATION_MODE_CURSOR;
          } else {
            stage.container().style.cursor = Constants.POINTER_CURSOR;
          }
        }}
        onMouseOut={() => {
          stage.container().style.cursor = Constants.DEFAULT_CURSOR;

          if (store.annotationStore.selected.relationMode) {
            item.setHighlight(false);
          }
        }}
        onClick={e => {
          if (!item.annotation.editable || item.parent.getSkipInteractions()) return;
          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = Constants.DEFAULT_CURSOR;
          }

          item.setHighlight(false);
          item.onClickRegion(e);
        }}
        listening={!suggestion && item.editable}
      />
      <LabelOnRect item={item} color={regionStyles.strokeColor} strokewidth={regionStyles.strokeWidth} />
    </RegionWrapper>
  );
};

const HtxRectangle = AliveRegion(HtxRectangleView);

Registry.addTag("rectangleregion", RectRegionModel, HtxRectangle);
Registry.addRegionType(RectRegionModel, "image");

export { RectRegionModel, HtxRectangle };
