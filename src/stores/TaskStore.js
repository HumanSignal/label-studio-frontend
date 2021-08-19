import { types, getParent } from "mobx-state-tree";
import RTree from 'rtree'; 

import Utilities from "../utils";

/**
 * Model for HTTP Basic Authorization
 */
const AuthStore = types.model({
  enable: types.optional(types.boolean, false),
  username: types.string,
  password: types.string,
  to: types.string,
});

/**
 * Task Store
 */
const TaskStore = types
  .model("Task", {
    id: types.maybeNull(types.number),
    load: types.optional(types.boolean, false),
    auth: types.maybeNull(AuthStore),
    /**
     * Data of task, may contain an object but in App Store will be transformed into string
     * MST doesn't support processing of dynamic objects with unkown keys value
     */
    data: types.maybeNull(types.string),
  })
  .views(self => ({
    get app() {
      return getParent(self);
    },

    /**
     * Return JSON with task data
     * @returns {object}
     */
    get dataObj() {
      if (Utilities.Checkers.isStringJSON(self.data)) {
        return JSON.parse(self.data);
      } else if (typeof self.data === "object") {
        return self.data;
      } else {
        return null;
      }
    },

    getTextFromBbox(searchX, searchY, searchW, searchH) {
      if (self.dataObj.ocrData) {
        if (!self.rtree) {
          self.createRTree();
        }

        const foundObjects = self.rtree.search({ x: searchX, y: searchY, w: searchW, h: searchH });

        if (foundObjects.length > 0) {
          const text = (foundObjects.reverse().map(obj => obj.description)).join(' ');

          return text;
        }
      }
      return null;
    },
  })).actions(self => ({
    createRTree() {
      if (self.dataObj.ocrData) {
        
        const bbrtree = RTree(10000);

        const textAnnotations = self.dataObj.ocrData.outputs[0].textAnnotations;

        textAnnotations.forEach((box, index) => {
          if (index === 0)
            return;
          
          const bbVertices = box.boundingPoly.vertices;

          bbrtree.insert({
            x: bbVertices[0].x,
            y: bbVertices[0].y,
            w: bbVertices[2].x - bbVertices[0].x,
            h: bbVertices[2].y - bbVertices[0].y,
          }, { description: box.description });
        });

        self.rtree = bbrtree;
      }
    },
  }),
  );

export default TaskStore;
