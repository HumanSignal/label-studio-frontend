import { types, destroy, getParentOfType, getRoot, isValidReference } from "mobx-state-tree";

import { cloneNode, guidGenerator } from "../core/Helpers";
import { RelationsModel } from "../tags/control/Relations";
import { TRAVERSE_SKIP } from "../core/Tree";
import Area from "../regions/Area";

/**
 * Relation between two different nodes
 */
const Relation = types
  .model("Relation", {
    id: types.optional(types.identifier, guidGenerator),

    node1: types.reference(Area),
    node2: types.reference(Area),

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
      const c = root.annotationStore.selected;

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

    setSelfHighlight(highlighted = false) {
      if (highlighted) {
        self.parent.setHighlight(self);
      } else {
        self.parent.removeHighlight();
      }
    },
  }));

const RelationStore = types
  .model("RelationStore", {
    _relations: types.array(Relation),
    showConnections: types.optional(types.boolean, true),
    highlighted: types.maybeNull(types.safeReference(Relation)),
  })
  .views(self => ({
    get relations() {
      // @todo fix undo/redo with relations
      // currently undo/redo doesn't consider relations at all,
      // so some relations can temporarily lose nodes they are connected to during undo/redo
      return self._relations.filter(r => isValidReference(() => r.node1) && isValidReference(() => r.node2));
    },
  }))
  .actions(self => ({
    findRelations(node1, node2) {
      const id1 = node1.id || node1;
      const id2 = node2?.id || node2;

      if (!id2) {
        return self.relations.filter(rl => {
          return rl.node1.id === id1 || rl.node2.id === id1;
        });
      }

      return self.relations.filter(rl => {
        return rl.node1.id === id1 && rl.node2.id === id2;
      });
    },

    nodesRelated(node1, node2) {
      return self.findRelations(node1, node2).length > 0;
    },

    addRelation(node1, node2) {
      if (self.nodesRelated(node1, node2)) return;

      const rl = Relation.create({ node1, node2 });

      // self.relations.unshift(rl);
      self._relations.push(rl);

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

    serializeAnnotation() {
      return self.relations.map(r => {
        const s = {
          from_id: r.node1.cleanId,
          to_id: r.node2.cleanId,
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

    toggleConnections() {
      self.showConnections = !self.showConnections;
    },

    setHighlight(relation) {
      self.highlighted = relation;
    },

    removeHighlight() {
      self.highlighted = null;
    },
  }));

export default RelationStore;
