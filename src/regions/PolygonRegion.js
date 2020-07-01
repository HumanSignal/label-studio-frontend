import Konva from "konva";
import React from "react";
import { Group, Line } from "react-konva";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, destroy, detach } from "mobx-state-tree";

import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import WithStatesMixin from "../mixins/WithStates";
import { ChoicesModel } from "../tags/control/Choices";
import { ImageModel } from "../tags/object/Image";
import { LabelOnPolygon } from "../components/ImageView/LabelOnRegion";
import { PolygonLabelsModel } from "../tags/control/PolygonLabels";
import { PolygonPoint, PolygonPointView } from "./PolygonPoint";
import { green } from "@ant-design/colors";
import { guidGenerator } from "../core/Helpers";
import { RatingModel } from "../tags/control/Rating";
import { TextAreaModel } from "../tags/control/TextArea";

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "polygonregion",

    opacity: types.number,
    fillColor: types.maybeNull(types.string),

    strokeWidth: types.number,
    strokeColor: types.string,

    pointSize: types.string,
    pointStyle: types.string,

    closed: types.optional(types.boolean, false),

    points: types.array(PolygonPoint, []),

    states: types.maybeNull(types.array(types.union(PolygonLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),

    mouseOverStartPoint: types.optional(types.boolean, false),

    selectedPoint: types.maybeNull(types.safeReference(PolygonPoint)),

    coordstype: types.optional(types.enumeration(["px", "perc"]), "px"),

    fromName: types.maybeNull(types.string),

    wp: types.maybeNull(types.number),
    hp: types.maybeNull(types.number),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, ImageModel);
    },
  }))
  .actions(self => ({
    /**
     * Handler for mouse on start point of Polygon
     * @param {boolean} val
     */
    setMouseOverStartPoint(value) {
      self.mouseOverStartPoint = value;
    },

    setSelectedPoint(point) {
      if (self.selectedPoint) {
        self.selectedPoint.selected = false;
      }

      point.selected = true;
      self.selectedPoint = point;
    },

    handleMouseMove({ e, flattenedPoints }) {
      let { offsetX: cursorX, offsetY: cursorY } = e.evt;
      let [x, y] = getAnchorPoint({ flattenedPoints, cursorX, cursorY });

      const group = e.currentTarget;
      const layer = e.currentTarget.getLayer();
      const zoom = self.parent.zoomScale;

      // TODO add the hover point only when in a non-zoomed mode,
      // reason is the coords in zoom mode act weird, need to put in
      // some time to find out why
      if (zoom === 1) moveHoverAnchor({ point: [x, y], group, layer, zoom });
    },

    handleMouseLeave({ e }) {
      removeHoverAnchor({ layer: e.currentTarget.getLayer() });
    },

    handleLineClick({ e, flattenedPoints, insertIdx }) {
      e.cancelBubble = true;

      if (!self.closed || !self.selected) return;

      removeHoverAnchor({ layer: e.currentTarget.getLayer() });

      const { offsetX: cursorX, offsetY: cursorY } = e.evt;
      const point = getAnchorPoint({ flattenedPoints, cursorX, cursorY });

      self.insertPoint(insertIdx, point[0], point[1]);
    },

    addPoint(x, y) {
      if (self.closed) return;
      self._addPoint(x, y);
    },

    insertPoint(insertIdx, x, y) {
      const p = {
        id: guidGenerator(),
        x: x,
        y: y,
        size: self.pointSize,
        style: self.pointStyle,
        index: self.points.length,
      };
      self.points.splice(insertIdx, 0, p);
    },

    _addPoint(x, y) {
      self.points.push({
        id: guidGenerator(),
        x: x,
        y: y,
        size: self.pointSize,
        style: self.pointStyle,
        index: self.points.length,
      });
    },

    // only px coordtype here
    rotate(degree = -90) {
      self.points.forEach(point => {
        const p = self.rotatePoint(point, degree);
        point._movePoint(p.x, p.y);
      });
    },

    closePoly() {
      self.closed = true;
      self.selectRegion();
    },

    canClose(x, y) {
      if (self.points.length < 2) return false;

      const p1 = self.points[0];
      const p2 = { x: x, y: y };

      var r = 50;
      var dist_points = (p1["x"] - p2["x"]) * (p1["x"] - p2["x"]) + (p1["y"] - p2["y"]) * (p2["y"] - p2["y"]);

      if (dist_points < r) {
        return true;
      } else {
        return false;
      }
    },

    destroyRegion() {
      detach(self.points);
      destroy(self.points);
    },

    afterUnselectRegion() {
      if (self.selectedPoint) {
        self.selectedPoint.selected = false;
      }

      // self.points.forEach(p => p.computeOffset());
    },

    updateAppearenceFromState() {
      const stroke = self.states[0].getSelectedColor();
      self.strokeColor = stroke;
      self.fillColor = stroke;
    },

    selectRegion() {
      if (self.parent.selected) {
        self.parent.selected.closed = true;
      }
      // self.points.forEach(p => p.computeOffset());

      self.selected = true;
      self.completion.setHighlightedNode(self);
      self.parent.setSelected(self.id);

      self.completion.loadRegionState(self);
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

    updateOffset() {
      self.points.map(p => p.computeOffset());
    },

    updateImageSize(wp, hp, sw, sh) {
      self.wp = wp;
      self.hp = hp;

      if (self.coordstype === "px") {
        self.points.forEach(p => {
          const x = (sw * p.relativeX) / 100;
          const y = (sh * p.relativeY) / 100;

          p._movePoint(x, y);
        });
      }

      if (!self.completion.sentUserGenerate && self.coordstype === "perc") {
        self.points.forEach(p => {
          const x = (sw * p.x) / 100;
          const y = (sh * p.y) / 100;
          self.coordstype = "px";
          p._movePoint(x, y);
        });
      }
    },

    serialize(control, object) {
      const { naturalWidth, naturalHeight, stageWidth, stageHeight } = object;
      const degree = -self.parent.rotation;
      const natural = self.rotateDimensions({ width: naturalWidth, height: naturalHeight }, degree);
      const { width, height } = self.rotateDimensions({ width: stageWidth, height: stageHeight }, degree);

      const perc_points = self.points.map(p => {
        const normalized = self.rotatePoint(p, degree, false);
        const res_w = (normalized.x * 100) / width;
        const res_h = (normalized.y * 100) / height;

        return [res_w, res_h];
      });

      let res = {
        value: {
          points: perc_points,
        },
        original_width: natural.width,
        original_height: natural.height,
        image_rotation: self.parent.rotation,
      };

      res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },
  }));

const PolygonRegionModel = types.compose(
  "PolygonRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
);

/**
 * Get coordinates of anchor point
 * @param {array} flattenedPoints
 * @param {number} cursorX coordinates of cursor X
 * @param {number} cursorY coordinates of cursor Y
 */
function getAnchorPoint({ flattenedPoints, cursorX, cursorY }) {
  const [point1X, point1Y, point2X, point2Y] = flattenedPoints;
  const y =
    ((point2X - point1X) * (point2X * point1Y - point1X * point2Y) +
      (point2X - point1X) * (point2Y - point1Y) * cursorX +
      (point2Y - point1Y) * (point2Y - point1Y) * cursorY) /
    ((point2Y - point1Y) * (point2Y - point1Y) + (point2X - point1X) * (point2X - point1X));
  const x =
    cursorX -
    ((point2Y - point1Y) *
      (point2X * point1Y - point1X * point2Y + cursorX * (point2Y - point1Y) - cursorY * (point2X - point1X))) /
      ((point2Y - point1Y) * (point2Y - point1Y) + (point2X - point1X) * (point2X - point1X));

  return [x, y];
}

function getFlattenedPoints(points) {
  const p = points.map(p => [p.x, p.y]);
  return p.reduce(function(flattenedPoints, point) {
    return flattenedPoints.concat(point);
  }, []);
}

function getHoverAnchor({ layer }) {
  return layer.findOne(".hoverAnchor");
}

/**
 * Create new anchor for current polygon
 */
function createHoverAnchor({ point, group, layer, zoom }) {
  const hoverAnchor = new Konva.Circle({
    name: "hoverAnchor",
    x: point[0],
    y: point[1],
    stroke: green.primary,
    fill: green[0],
    scaleX: 1 / (zoom || 1),
    scaleY: 1 / (zoom || 1),

    strokeWidth: 2,
    radius: 5,
  });

  group.add(hoverAnchor);
  layer.draw();
  return hoverAnchor;
}

function moveHoverAnchor({ point, group, layer, zoom }) {
  const hoverAnchor = getHoverAnchor({ layer }) || createHoverAnchor({ point, group, layer, zoom });
  hoverAnchor.to({ x: point[0], y: point[1], duration: 0 });
}

function removeHoverAnchor({ layer }) {
  const hoverAnchor = getHoverAnchor({ layer });
  if (!hoverAnchor) return;
  hoverAnchor.destroy();
  layer.draw();
}

const HtxPolygonView = ({ store, item }) => {
  /**
   * Render line between 2 points
   */
  function renderLine({ points, idx1, idx2 }) {
    const name = `border_${idx1}_${idx2}`;
    let { strokeColor, strokeWidth } = item;

    if (item.highlighted) {
      strokeColor = Constants.HIGHLIGHTED_STROKE_COLOR;
      strokeWidth = Constants.HIGHLIGHTED_STROKE_WIDTH;
    }

    if (!item.closed && idx2 === 0) return null;

    const insertIdx = idx1 + 1; // idx1 + 1 or idx2
    const flattenedPoints = getFlattenedPoints([points[idx1], points[idx2]]);
    return (
      <Group
        key={name}
        name={name}
        onClick={e => item.handleLineClick({ e, flattenedPoints, insertIdx })}
        onMouseMove={e => {
          if (!item.closed || !item.selected || !item.editable) return;

          item.handleMouseMove({ e, flattenedPoints });
        }}
        onMouseLeave={e => item.handleMouseLeave({ e })}
      >
        <Line
          points={flattenedPoints}
          stroke={strokeColor}
          opacity={item.opacity}
          lineJoin="bevel"
          strokeWidth={strokeWidth}
          strokeScaleEnabled={false}
        />
      </Group>
    );
  }

  function renderLines(points) {
    const name = "borders";
    return (
      <Group key={name} name={name}>
        {points.map((p, idx) => {
          const idx1 = idx;
          const idx2 = idx === points.length - 1 ? 0 : idx + 1;
          return renderLine({ points, idx1, idx2 });
        })}
      </Group>
    );
  }

  function renderPoly(points) {
    const name = "poly";
    return (
      <Group key={name} name={name}>
        <Line
          lineJoin="bevel"
          points={getFlattenedPoints(points)}
          fill={item.strokeColor}
          closed={true}
          opacity={0.2}
        />
      </Group>
    );
  }

  function renderCircle({ points, idx }) {
    const name = `anchor_${points.length}_${idx}`;
    const point = points[idx];

    if (!item.closed || (item.closed && item.selected)) {
      return <PolygonPointView item={point} name={name} key={name} />;
    }
  }

  function renderCircles(points) {
    const name = "anchors";
    return (
      <Group key={name} name={name}>
        {points.map((p, idx) => renderCircle({ points, idx }))}
      </Group>
    );
  }

  function minMax(items) {
    return items.reduce((acc, val) => {
      acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
      acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];
      return acc;
    }, []);
  }

  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;

  return (
    <Group
      key={item.id ? item.id : guidGenerator(5)}
      onDragStart={e => {
        item.completion.setDragMode(true);

        var arrX = item.points.map(p => p.x);
        var arrY = item.points.map(p => p.y);

        [minX, maxX] = minMax(arrX);
        [minY, maxY] = minMax(arrY);
      }}
      dragBoundFunc={function(pos) {
        let { x, y } = pos;

        const sw = item.parent.stageWidth;
        const sh = item.parent.stageHeight;

        if (minY + y < 0) y = -1 * minY;
        if (minX + x < 0) x = -1 * minX;
        if (maxY + y > sh) y = sh - maxY;
        if (maxX + x > sw) x = sw - maxX;

        return { x: x, y: y };
      }}
      onDragEnd={e => {
        const t = e.target;

        item.completion.setDragMode(false);
        if (!item.closed) item.closePoly();

        item.points.forEach(p => p.movePoint(t.getAttr("x"), t.getAttr("y")));

        t.setAttr("x", 0);
        t.setAttr("y", 0);
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
        e.cancelBubble = true;

        // if (!item.editable) return;

        if (!item.closed) return;

        const stage = item.parent.stageRef;

        if (store.completionStore.selected.relationMode) {
          stage.container().style.cursor = Constants.DEFAULT_CURSOR;
        }

        item.setHighlight(false);
        item.onClickRegion();
      }}
      draggable={item.editable && item.parent.zoomScale === 1}
    >
      {item.mouseOverStartPoint}

      {item.points && item.closed ? renderPoly(item.points) : null}
      {item.points ? renderLines(item.points) : null}
      {item.points ? renderCircles(item.points) : null}

      <LabelOnPolygon item={item} />
    </Group>
  );
};

const HtxPolygon = inject("store")(observer(HtxPolygonView));

Registry.addTag("polygonregion", PolygonRegionModel, HtxPolygon);

export { PolygonRegionModel, HtxPolygon };
