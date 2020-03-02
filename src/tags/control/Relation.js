import React from "react";
import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Constants from "../../core/Constants";
import { guidGenerator } from "../../core/Helpers";

/**
 * Relation tag represents a single relation label
 * @example
 * <View>
 *   <Relations>
 *     <Relation value="Name 1" />
 *     <Relation value="Name 2" />
 *   </Relations>
 * </View>
 * @name Relation
 * @param {string} value A value of the relation
 * @param {string} background The background color of active label
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  background: types.optional(types.string, Constants.RELATION_BACKGROUND),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    selected: types.optional(types.boolean, false),
    type: "relation",
  })
  .actions(self => ({
    setSelected(value) {
      self.selected = value;
    },
  }));

const RelationModel = types.compose("RelationModel", TagAttrs, Model);

const HtxRelationView = () => {
  return null;
};

Registry.addTag("relation", RelationModel, HtxRelationView);

export { HtxRelationView, RelationModel };
