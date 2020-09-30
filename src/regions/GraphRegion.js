import Konva from "konva";
import React from "react";
import { Group, Line, Circle } from "react-konva";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, destroy, detach } from "mobx-state-tree";

import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import WithStatesMixin from "../mixins/WithStates";
import { ChoicesModel } from "../tags/control/Choices";
import { ImageModel } from "../tags/object/Image";
import { LabelOnGraph } from "../components/ImageView/LabelOnRegion";
import { GraphLabelsModel } from "../tags/control/GraphLabels";
import { green } from "@ant-design/colors";
import { guidGenerator } from "../core/Helpers";
import { RatingModel } from "../tags/control/Rating";
import { TextAreaModel } from "../tags/control/TextArea";
import { Vertex, VertexView } from "./GraphRegion/Vertex";
import { Edge, EdgeView } from "./GraphRegion/Edge";

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "graphregion",

    opacity: types.optional(types.number, 0.9),
    fillColor: types.maybeNull(types.string),

    strokeWidth: types.number,
    strokeColor: types.string,

    vertexSize: types.string,
    vertexStyle: types.string,

    closed: types.optional(types.boolean, false),

    vertices: types.array(Vertex, []),
    curIndex: types.optional(types.number, 0),
    edges: types.array(Edge, []),

    states: types.maybeNull(types.array(types.union(GraphLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),

    selectedVertex: types.maybeNull(types.safeReference(Vertex)),

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
    setSelectedVertex(vert) {
      if (self.selectedVertex) {
        self.selectedVertex.selected = false;
      }

      vert.selected = true;
      self.selectedVertex = vert;
    },

    shouldClose() {
      return self.curIndex >= self.vertices.length;
    },

    closeGraph() {
      self.closed = true;
      self.selectRegion();
    },

    incrementIndex() {
      self.curIndex += 1;
    },

    addEdge(v1, v2, value) {
      const e = {
        v1: v1,
        v2: v2,
        value: value,
      };
      self.edges.push(e);
    },

    updateVertex(x, y, idx) {
      if (idx < self.vertices.length && idx >= 0) {
        self.vertices[idx]._moveVertex(x, y);
      }
    },

    addVertex(x, y, val) {
      if (self.closed) return;
      self._addVertex(x, y, val);
    },

    insertVertex(insertIdx, x, y, val) {
      const p = {
        id: guidGenerator(),
        x: x,
        y: y,
        value: val,
        size: self.vertexSize,
        style: self.vertexStyle,
        index: self.vertices.length,
      };
      self.vertices.splice(insertIdx, 0, p);
    },

    _addVertex(x, y, val) {
      self.vertices.push({
        id: guidGenerator(),
        x: x,
        y: y,
        value: val,
        size: self.vertexSize,
        style: self.vertexStyle,
        index: self.vertices.length,
      });
    },

    destroyRegion() {
      detach(self.selectedVertex);
      detach(self.edges);
      destroy(self.edges);
      detach(self.vertices);
      destroy(self.vertices);
    },

    afterUnselectRegion() {
      if (self.selectedVertex) {
        self.selectedVertex.selected = false;
      }
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
        self.vertices.forEach(p => {
          const x = (sw * p.relativeX) / 100;
          const y = (sh * p.relativeY) / 100;

          p._moveVertex(x, y);
        });
      }

      if (!self.completion.sentUserGenerate && self.coordstype === "perc") {
        self.vertices.forEach(p => {
          const x = (sw * p.x) / 100;
          const y = (sh * p.y) / 100;
          self.coordstype = "px";
          p._moveVertex(x, y);
        });
      }
    },

    serialize(control, object) {
      const { naturalWidth, naturalHeight, stageWidth, stageHeight } = object;

      const perc_w = (stageWidth * 100) / naturalWidth;
      const perc_h = (stageHeight * 100) / naturalHeight;

      const perc_vertices = self.vertices.map(p => {
        const orig_w = (p.x * 100) / perc_w;
        const res_w = (orig_w * 100) / naturalWidth;

        const orig_h = (p.y * 100) / perc_h;
        const res_h = (orig_h * 100) / naturalHeight;

        return [res_w, res_h, p.value];
      });

      // We don't save edges to save space.  Edges can be found in the config file.
      let res = {
        value: {
          vertices: perc_vertices,
        },
        original_width: naturalWidth,
        original_height: naturalHeight,
      };

      res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },
  }));

const GraphRegionModel = types.compose("GraphRegionModel", WithStatesMixin, RegionsMixin, NormalizationMixin, Model);

const HtxGraphView = ({ store, item }) => {
  /**
   * Render line between 2 points
   */
  function renderEdges(edges) {
    const name = "borders";
    return (
      <Group key={name} name={name}>
        {edges.map((e, idx) => (e.v1.x !== -1 && e.v2.x !== -1 ? renderEdge({ edges, idx }) : null))}
      </Group>
    );
  }

  function renderEdge({ edges, idx }) {
    const name = `edge_${idx}`;
    const edge = edges[idx];
    return <EdgeView item={edge} name={name} key={name} />;
  }

  function renderVertex({ vertices, idx }) {
    const name = `vertex_${vertices.length}_${idx}`;
    const vert = vertices[idx];

    return <VertexView item={vert} name={name} key={name} />;
  }

  function renderVertices(vertices) {
    const name = "vertices";
    return (
      <Group key={name} name={name}>
        {vertices.map((v, idx) => (v.x !== -1 ? renderVertex({ vertices, idx }) : null))}
      </Group>
    );
  }

  return (
    <Group
      key={item.id ? item.id : guidGenerator(5)}
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
      draggable={false}
    >
      {item.edges ? renderEdges(item.edges) : null}
      {item.vertices ? renderVertices(item.vertices) : null}

      <LabelOnGraph item={item} />
    </Group>
  );
};

const HtxGraph = inject("store")(observer(HtxGraphView));

Registry.addTag("graphregion", GraphRegionModel, HtxGraph);

export { GraphRegionModel, HtxGraph };
