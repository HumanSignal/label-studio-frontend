import { types } from "mobx-state-tree";
import RTree from 'rtree';

export const TaskStoreExtension = types.model()
  .views(self => ({

    getTextFromBbox(searchX, searchY, searchW, searchH) {

      if (self.dataObj.ocrData) {
        if (!self.bbtree) {
          self.createRTree();
        }

        const foundObjects = self.bbtree.search({ x: searchX, y: searchY, w: searchW, h: searchH });

        if (foundObjects.length > 0) {

          foundObjects.reverse();
          return foundObjects;
        }
      }

      return null;
    },
  })).actions(self => ({
    createRTree() {
      if (self.dataObj.ocrData) {

        const bbtree = RTree(10000);

        const textAnnotations = self.dataObj.ocrData.outputs[0].textAnnotations;

        textAnnotations.forEach((box, index) => {
          if (index === 0)
            return;

          const bbVertices = box.boundingPoly.vertices;

          bbtree.insert({
            x: bbVertices[0].x,
            y: bbVertices[0].y,
            w: bbVertices[2].x - bbVertices[0].x,
            h: bbVertices[2].y - bbVertices[0].y,
          }, {
            description: box.description,
            area: {
              x: bbVertices[0].x,
              y: bbVertices[0].y,
              width: bbVertices[2].x - bbVertices[0].x,
              height: bbVertices[2].y - bbVertices[0].y,
              rotation: 0,
              coordstype: "px",
            },
          });
        });

        self.bbtree = bbtree;
      }
    },
  }),
  );