import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { GraphRegionModel } from "../regions/GraphRegion";

const _Tool = types
  .model({
    default: types.optional(types.boolean, true),
    mode: types.optional(types.enumeration(["drawing", "viewing", "brush", "eraser"]), "viewing"),
  })
  .views(self => ({
    get getActiveGraph() {
      const graph = self.getActiveShape;

      if (graph && graph.closed) return null;
      if (graph === undefined) return null;
      if (graph.type !== "graphregion") return null;

      return graph;
    },

    get tagTypes() {
      return {
        stateTypes: "graphlabels",
        controlTagTypes: ["graphlabels", "graphlabel"],
      };
    },

    moreRegionParams(obj) {
      return {
        x: obj.value.vertices[0][0],
        y: obj.value.vertices[0][1],
      };
    },
  }))
  .actions(self => ({
    fromStateJSON(obj, controlTag) {
      const graph = self.createFromJSON(obj, controlTag);
      if (graph) {
        for (var i = 0; i < obj.value.vertices.length; i++) {
          graph.updateVertex(obj.value.vertices[i][0], obj.value.vertices[i][1], i);
          if (obj.value.vertices[i][2]) {
            graph.vertices[i].toggleOcclusion();
          }
        }
        graph.closeGraph();
      }
    },

    createRegion(opts) {
      let newGraph = self.getActiveGraph;
      // self.freezeHistory();
      const image = self.obj;
      const c = self.control;

      delete opts["vertices"];
      delete opts["edges"];

      if (!newGraph) {
        newGraph = GraphRegionModel.create({
          opacity: Number(c.opacity),
          strokeWidth: Number(c.strokewidth),
          fillOpacity: Number(c.fillopacity),
          vertexSize: c.vertexsize,
          vertexStyle: c.vertexstyle,
          value: c.value,
          ...opts,
        });
        image.addShape(newGraph);

        // Find the graph we need
        const graphControl = c.children.find(child => child.type === "graphlabel" && child.selected);
        let helperMap = new Map();

        // Add the vertices and edges here
        for (var i = 0; i < graphControl.children.length; i++) {
          if (graphControl.children[i].type == "vertex") {
            newGraph.addVertex(-1, -1, graphControl.children[i].value);
            helperMap.set(graphControl.children[i].value, newGraph.vertices[i]);
          }
        }
        for (var i = 0; i < graphControl.children.length; i++) {
          if (graphControl.children[i].type == "edge") {
            if (!(helperMap.has(graphControl.children[i].v1) && helperMap.has(graphControl.children[i].v2))) {
              throw `Unable to initalize edge with vertices: ${graphControl.children[i].v1}, ${graphControl.children[i].v2}`;
            }
            let v1 = helperMap.get(graphControl.children[i].v1);
            let v2 = helperMap.get(graphControl.children[i].v2);
            newGraph.addEdge(v1, v2, graphControl.children[i].value);
          }
        }
      }

      newGraph.updateVertex(opts.x, opts.y, newGraph.curIndex);
      newGraph.setSelectedVertex(newGraph.vertices[newGraph.curIndex]);
      newGraph.incrementIndex();

      if (newGraph.shouldClose()) {
        newGraph.closeGraph();
      }

      return newGraph;
    },

    clickEv(ev, [x, y]) {
      if (self.control.type === "graphlabels") if (!self.control.isSelected && self.getActiveGraph === null) return;

      if (!self.getActiveGraph && !self.obj.checkLabels()) return;

      const sap = self.statesAndParams;

      self.createRegion({
        x: x,
        y: y,
        width: 10,
        coordstype: "px",
        ...sap,
      });
    },
  }));

const Graph = types.compose(ToolMixin, BaseTool, _Tool);

export { Graph };
