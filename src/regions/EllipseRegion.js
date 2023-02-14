import React, { Fragment, useContext } from 'react';
import { Ellipse } from 'react-konva';
import { getRoot, types } from 'mobx-state-tree';

import Constants from '../core/Constants';
import Registry from '../core/Registry';
import NormalizationMixin from '../mixins/Normalization';
import RegionsMixin from '../mixins/Regions';

import { ImageViewContext } from '../components/ImageView/ImageViewContext';
import { LabelOnEllipse } from '../components/ImageView/LabelOnRegion';
import { guidGenerator } from '../core/Helpers';
import { useRegionStyles } from '../hooks/useRegionColor';
import { AreaMixin } from '../mixins/AreaMixin';
import { KonvaRegionMixin } from '../mixins/KonvaRegion';
import { ImageModel } from '../tags/object/Image';
import { rotateBboxCoords } from '../utils/bboxCoords';
import { FF_DEV_3793, isFF } from '../utils/feature-flags';
import { createDragBoundFunc } from '../utils/image';
import { AliveRegion } from './AliveRegion';
import { EditableRegion } from './EditableRegion';

const EllipseRegionAbsoluteCoordsDEV3793 = types
  .model({
    coordstype: types.optional(types.enumeration(['px', 'perc']), 'perc'),
  })
  .volatile(() => ({
    relativeX: 0,
    relativeY: 0,
    relativeWidth: 0,
    relativeHeight: 0,
    relativeRadiusX: 0,
    relativeRadiusY: 0,
  }))
  .actions(self => ({
    afterCreate() {
      self.startX = self.x;
      self.startY = self.y;

      switch (self.coordstype)  {
        case 'perc': {
          self.relativeX = self.x;
          self.relativeY = self.y;
          self.relativeRadiusX = self.radiusX;
          self.relativeRadiusY = self.radiusY;
          self.relativeWidth = self.width;
          self.relativeHeight = self.height;
          break;
        }
        case 'px': {
          const { stageWidth, stageHeight } = self.parent;

          if (stageWidth && stageHeight) {
            self.setPosition(self.x, self.y, self.radiusX, self.radiusY, self.rotation);
          }
          break;
        }
      }
      self.checkSizes();
      self.updateAppearenceFromState();
    },
    setPosition(x, y, radiusX, radiusY, rotation) {
      self.x = x;
      self.y = y;
      self.radiusX = radiusX;
      self.radiusY = radiusY;

      self.relativeX = (x / self.parent?.stageWidth) * 100;
      self.relativeY = (y / self.parent?.stageHeight) * 100;

      self.relativeRadiusX = (radiusX / self.parent?.stageWidth) * 100;
      self.relativeRadiusY = (radiusY / self.parent?.stageHeight) * 100;

      self.rotation = (rotation + 360) % 360;
    },
    setPositionInternal(x, y, radiusX, radiusY, rotation) {
      return self.setPosition(x, y, radiusX, radiusY, rotation);
    },
    updateImageSize(wp, hp, sw, sh) {
      self.sw = sw;
      self.sh = sh;

      if (self.coordstype === 'px') {
        self.x = (sw * self.relativeX) / 100;
        self.y = (sh * self.relativeY) / 100;
        self.radiusX = (sw * self.relativeRadiusX) / 100;
        self.radiusY = (sh * self.relativeRadiusY) / 100;
      } else if (self.coordstype === 'perc') {
        self.x = (sw * self.x) / 100;
        self.y = (sh * self.y) / 100;
        self.radiusX = (sw * self.radiusX) / 100;
        self.radiusY = (sh * self.radiusY) / 100;
        self.coordstype = 'px';
      }
    },
  }));

/**
 * Ellipse object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: 'ellipseregion',
    object: types.late(() => types.reference(ImageModel)),

    x: types.number,
    y: types.number,
    radiusX: types.number,
    radiusY: types.number,

    rotation: 0,
  })
  .volatile(() => ({
    startX: 0,
    startY: 0,

    // @todo not used
    scaleX: 1,
    scaleY: 1,

    opacity: types.number,

    fill: true,
    fillColor: Constants.FILL_COLOR,
    fillOpacity: 0.2,

    strokeColor: Constants.STROKE_COLOR,
    strokeWidth: Constants.STROKE_WIDTH,

    _supportsTransform: true,
    hideable: true,

    editableFields: [
      { property: 'x', label: 'X' },
      { property: 'y', label: 'Y' },
      { property: 'radiusX', label: 'Rx' },
      { property: 'radiusY', label: 'Ry' },
      { property: 'rotation', label: 'icon:angle' },
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
    get bboxCoords() {
      const bboxCoords= {
        left: self.x - self.radiusX,
        top: self.y - self.radiusY,
        right: self.x + self.radiusX,
        bottom: self.y + self.radiusY,
      };

      return self.rotation !== 0 ? rotateBboxCoords(bboxCoords, self.rotation, { x: self.x, y:self.y }) : bboxCoords;
    },
  }))
  .actions(self => ({
    afterCreate() {
      self.startX = self.x;
      self.startY = self.y;
    },

    // @todo not used
    coordsInside(x, y) {
      // check if x and y are inside the rectangle
      const a = self.radiusX;
      const b = self.radiusY;

      const cx = self.x;
      const cy = self.y;
      //going to system where center coordinates are (0,0)
      let rel_x = x - cx;
      let rel_y = y - cy;

      //going to system where our ellipse has angle 0 to X-Axis via rotate matrix
      const theta = self.rotation;

      rel_x = rel_x * Math.cos(Math.unit(theta, 'deg')) - rel_y * Math.sin(Math.unit(theta, 'deg'));
      rel_y = rel_x * Math.sin(Math.unit(theta, 'deg')) + rel_y * Math.cos(Math.unit(theta, 'deg'));

      if (Math.abs(rel_x) < a) {
        if (Math.pow(rel_y, 2) < Math.pow(b, 2) * (1 - Math.pow(rel_x, 2) / Math.pow(a, 2))) {
          return true;
        }
      } else {
        return false;
      }
    },

    setPositionInternal(x, y, radiusX, radiusY, rotation) {
      self.x = x;
      self.y = y;
      self.radiusX = radiusX;
      self.radiusY = radiusY;
      self.rotation = (rotation + 360) % 360;
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
      self.setPositionInternal(
        self.parent.screenToInternalX(x),
        self.parent.screenToInternalY(y),
        self.parent.screenToInternalX(radiusX),
        self.parent.screenToInternalY(radiusY),
        rotation,
      );
    },

    setScale(x, y) {
      self.scaleX = x;
      self.scaleY = y;
    },

    setFill(color) {
      self.fill = color;
    },

    updateImageSize() {},

    /**
     * @example
     * {
     *   "original_width": 1920,
     *   "original_height": 1280,
     *   "image_rotation": 0,
     *   "value": {
     *     "x": 3.1,
     *     "y": 8.2,
     *     "radiusX": 20,
     *     "radiusY": 16,
     *     "ellipselabels": ["Car"]
     *   }
     * }
     * @typedef {Object} EllipseRegionResult
     * @property {number} original_width width of the original image (px)
     * @property {number} original_height height of the original image (px)
     * @property {number} image_rotation rotation degree of the image (deg)
     * @property {Object} value
     * @property {number} value.x x coordinate of the top left corner before rotation (0-100)
     * @property {number} value.y y coordinate of the top left corner before rotation (0-100)
     * @property {number} value.radiusX radius by x axis (0-100)
     * @property {number} value.radiusY radius by y axis (0-100)
     * @property {number} value.rotation rotation degree (deg)
     */

    /**
     * @return {EllipseRegionResult}
     */
    serialize() {
      const res = {
        original_width: self.parent.naturalWidth,
        original_height: self.parent.naturalHeight,
        image_rotation: self.parent.rotation,
        value: {
          x: isFF(FF_DEV_3793) ? self.x : self.convertXToPerc(self.x),
          y: isFF(FF_DEV_3793) ? self.y : self.convertYToPerc(self.y),
          radiusX: isFF(FF_DEV_3793) ? self.radiusX : self.convertHDimensionToPerc(self.radiusX),
          radiusY: isFF(FF_DEV_3793) ? self.radiusY : self.convertVDimensionToPerc(self.radiusY),
          rotation: self.rotation,
        },
      };

      return res;
    },
  }));

const EllipseRegionModel = types.compose(
  'EllipseRegionModel',
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  KonvaRegionMixin,
  EditableRegion,
  Model,
  ...(isFF(FF_DEV_3793) ? [] : [EllipseRegionAbsoluteCoordsDEV3793]),
);

const HtxEllipseView = ({ item }) => {
  const { store } = item;

  const regionStyles = useRegionStyles(item);
  const stage = item.parent.stageRef;
  const { suggestion } = useContext(ImageViewContext) ?? {};

  return (
    <Fragment>
      <Ellipse
        x={isFF(FF_DEV_3793) ? item.parent.internalToScreenX(item.x) : item.x}
        y={isFF(FF_DEV_3793) ? item.parent.internalToScreenY(item.y) : item.y}
        radiusX={isFF(FF_DEV_3793) ? item.parent.internalToScreenX(item.radiusX) : item.radiusX}
        radiusY={isFF(FF_DEV_3793) ? item.parent.internalToScreenY(item.radiusY) : item.radiusY}
        fill={regionStyles.fillColor}
        stroke={regionStyles.strokeColor}
        strokeWidth={regionStyles.strokeWidth}
        strokeScaleEnabled={false}
        shadowBlur={0}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        opacity={1}
        rotation={item.rotation}
        name={`${item.id} _transformable`}
        onTransform={({ target }) => {
          // resetting the skew makes transformations weird but predictable
          target.setAttr('skewX', 0);
          target.setAttr('skewY', 0);
        }}
        onTransformEnd={e => {
          const t = e.target;

          item.setPosition(
            t.getAttr('x'),
            t.getAttr('y'),
            t.getAttr('radiusX') * t.getAttr('scaleX'),
            t.getAttr('radiusY') * t.getAttr('scaleY'),
            t.getAttr('rotation'),
          );

          t.setAttr('scaleX', 1);
          t.setAttr('scaleY', 1);
          item.notifyDrawingFinished();
        }}
        onDragStart={e => {
          if (item.parent.getSkipInteractions()) {
            e.currentTarget.stopDrag(e.evt);
            return;
          }
          item.annotation.history.freeze(item.id);
        }}
        onDragEnd={e => {
          const t = e.target;

          item.setPosition(
            t.getAttr('x'),
            t.getAttr('y'),
            t.getAttr('radiusX'),
            t.getAttr('radiusY'),
            t.getAttr('rotation'),
          );
          item.setScale(t.getAttr('scaleX'), t.getAttr('scaleY'));
          item.annotation.history.unfreeze(item.id);
          item.notifyDrawingFinished();
        }}
        dragBoundFunc={createDragBoundFunc(item, { x: item.x - item.bboxCoords.left, y: item.y - item.bboxCoords.top })}
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
          if (item.parent.getSkipInteractions()) return;

          if (store.annotationStore.selected.relationMode) {
            stage.container().style.cursor = Constants.DEFAULT_CURSOR;
          }

          item.setHighlight(false);
          item.onClickRegion(e);
        }}
        draggable={item.editable}
        listening={!suggestion}
      />
      <LabelOnEllipse item={item} color={regionStyles.strokeColor} strokewidth={regionStyles.strokeWidth}/>
    </Fragment>
  );
};

const HtxEllipse = AliveRegion(HtxEllipseView);

Registry.addTag('ellipseregion', EllipseRegionModel, HtxEllipse);
Registry.addRegionType(EllipseRegionModel, 'image');

export { EllipseRegionModel, HtxEllipse };
