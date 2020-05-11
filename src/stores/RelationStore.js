import { types, destroy, getParentOfType, getRoot } from "mobx-state-tree";

import { cloneNode } from "../core/Helpers";
import { AllRegionsType } from "../regions";
import { RelationsModel } from "../tags/control/Relations";
import { TRAVERSE_SKIP } from "../core/Tree";

/**
 * Relation between two different nodes
 */
const Relation = types
  .model("Relation", {
    node1: types.reference(AllRegionsType),
    node2: types.reference(AllRegionsType),
    direction: types.optional(types.enumeration(["left", "right", "bi"]), "right"),

    // labels
    relations: types.maybeNull(RelationsModel),

    showMeta: types.optional(types.boolean, false),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, RelationStore);
    },

    get hasRelations() {
      const r = self.relations;
      return r && r.children && r.children.length > 0;
    },
  }))
  .actions(self => ({
    afterAttach() {
      const root = getRoot(self);
      const c = root.completionStore.selected;

      // find <Relations> tag in the tree
      let relations = null;
      c.traverseTree(function(node) {
        if (node.type === "relations") {
          relations = node;
          return TRAVERSE_SKIP;
        }
      });

      if (relations !== null) {
        self.relations = cloneNode(relations);
      }
    },

    rotateDirection() {
      const d = ["left", "right", "bi"];
      let idx = d.findIndex(item => item === self.direction);

      idx = idx + 1;
      if (idx >= d.length) idx = 0;

      self.direction = d[idx];
    },

    toggleHighlight() {
      if (self.node1 === self.node2) {
        self.node1.toggleHighlight();
      } else {
        self.node1.toggleHighlight();
        self.node2.toggleHighlight();
      }
    },

    toggleMeta() {
      self.showMeta = !self.showMeta;
    },
  }));

const RelationStore = types
  .model("RelationStore", {
    relations: types.array(Relation),
  })
  .actions(self => ({
    findRelations(node1, node2) {
      if (!node2) {
        return self.relations.filter(rl => {
          return rl.node1.id === node1.id || rl.node2.id === node1.id;
        });
      }

      return self.relations.filter(rl => {
        return rl.node1.id === node1.id && rl.node2.id === node2.id;
      });
    },

    nodesRelated(node1, node2) {
      return self.findRelations(node1, node2).length > 0;
    },

    addRelation(node1, node2) {
      if (self.nodesRelated(node1, node2)) return;

      const rl = Relation.create({
        node1: node1,
        node2: node2,
      });

      // self.relations.unshift(rl);
      self.relations.push(rl);

      return rl;
    },

    deleteRelation(rl) {
      destroy(rl);
    },

    deleteNodeRelation(node) {
      // lookup $node and delete it's relation
      const rl = self.findRelations(node);
      rl.length && rl.forEach(self.deleteRelation);
    },

    serializeCompletion() {
      return self.relations.map(r => {
        const s = {
          from_id: r.node1.pid,
          to_id: r.node2.pid,
          type: "relation",
          direction: r.direction,
        };

        if (r.relations) s["labels"] = r.relations.selectedValues();

        return s;
      });
    },

    deserializeRelation(node1, node2, direction, labels) {
      const rl = self.addRelation(node1, node2);
      rl.direction = direction;

      if (rl.relations && labels)
        labels.forEach(l => {
          const r = rl.relations.findRelation(l);
          if (r) r.setSelected(true);
        });
    },
  }));

export default RelationStore;
